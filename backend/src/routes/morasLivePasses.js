const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { MorasLiveAudiencePass } = require('../models/MorasLiveAudiencePass');
const { MorasLivePayment } = require('../models/MorasLivePayment');
const { MorasLiveEventSettings } = require('../models/MorasLiveEventSettings');
const { generateAudiencePassId } = require('../utils/generateAudiencePassId');
const {
  generateQrToken,
  hashQrToken,
  generateQrCodeDataUrl,
  buildPassQrPayload,
} = require('../utils/qrPassCrypto');

// Rate limiter for pass reservations
const passReservationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many pass reservation requests from this IP. Please try again after 15 minutes.',
  },
});

// Helper: Normalize 10-digit Indian Mobile
function normalizeIndianMobile(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  return null;
}

// Helper: Escape CSV fields
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// =========================================================================
// 1. PUBLIC: GET EVENT SETTINGS & LIVE INVENTORY
// GET /api/moras-live/passes/settings
// =========================================================================
router.get('/settings', async (req, res) => {
  try {
    const settings = await MorasLiveEventSettings.getSettings('moras-live-2026');
    const now = new Date();

    // Auto-expire stale reservations
    await MorasLiveAudiencePass.updateMany(
      {
        eventId: 'moras-live-2026',
        reservationStatus: 'RESERVED',
        expiresAt: { $lte: now },
      },
      { $set: { reservationStatus: 'EXPIRED' } }
    );

    // Concurrency-safe count calculation
    const activeReservedCount = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      reservationStatus: 'RESERVED',
      paymentStatus: { $ne: 'PAID' },
      expiresAt: { $gt: now },
    });

    const paidCount = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      paymentStatus: 'PAID',
    });

    const maxPasses = settings.maximumPasses || 60;
    const totalAllocated = activeReservedCount + paidCount;
    const availablePasses = Math.max(0, maxPasses - totalAllocated);

    return res.json({
      success: true,
      settings: {
        eventId: settings.eventId,
        eventName: settings.eventName,
        tagline: settings.tagline,
        eventDate: settings.eventDate, // May be unconfirmed
        eventStartTime: settings.eventStartTime,
        eventEndTime: settings.eventEndTime,
        venue: settings.venue,
        maximumPasses: maxPasses,
        proposedPassPrice: settings.proposedPassPrice,
        approvedPassPrice: settings.priceConfirmed ? settings.approvedPassPrice : null,
        priceConfirmed: settings.priceConfirmed,
        reservationsEnabled: settings.reservationsEnabled,
        paymentCollectionEnabled: settings.paymentCollectionEnabled && settings.priceConfirmed,
        reservationExpiryHours: settings.reservationExpiryHours,
        cappuccinoIncluded: settings.cappuccinoIncluded,
      },
      inventory: {
        maximumPasses: maxPasses,
        activeReservedCount,
        paidCount,
        totalAllocated,
        availablePasses,
        isSoldOut: availablePasses <= 0,
      },
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve event pass settings' });
  }
});

// =========================================================================
// 2. PUBLIC: RESERVE AUDIENCE PASS (ONE PERSON = ONE PASS = ONE QR)
// POST /api/moras-live/passes/reserve
// =========================================================================
router.post('/reserve', passReservationLimiter, async (req, res) => {
  try {
    const { fullName, mobileNumber, email } = req.body || {};

    // 1. Full Name Validation
    const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        field: 'fullName',
        message: 'Please provide a valid full name between 2 and 100 characters.',
      });
    }

    // 2. Mobile Number Validation (Strict 10-digit Indian)
    const normalizedMobile = normalizeIndianMobile(mobileNumber);
    if (!normalizedMobile) {
      return res.status(400).json({
        success: false,
        field: 'mobileNumber',
        message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9845012345).',
      });
    }

    // 3. Email Validation
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail) || cleanEmail.length > 150) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Please enter a valid email address.',
      });
    }

    // 4. Check Event Settings
    const settings = await MorasLiveEventSettings.getSettings('moras-live-2026');
    if (!settings.reservationsEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Online pass reservations are currently paused by the administrator.',
      });
    }

    const now = new Date();

    // 5. Duplicate Check: One Mobile Number = One Pass
    const existing = await MorasLiveAudiencePass.findOne({
      eventId: 'moras-live-2026',
      normalizedMobileNumber: normalizedMobile,
    });

    if (existing) {
      // Check if existing pass is paid or currently reserved
      const isPaid = existing.paymentStatus === 'PAID';
      const isStillReserved = existing.reservationStatus === 'RESERVED' && existing.expiresAt > now;

      if (isPaid || isStillReserved) {
        const qrPayload = buildPassQrPayload(existing.passId, existing.qrToken, req);
        const qrCodeDataUrl = await generateQrCodeDataUrl(qrPayload);

        return res.status(409).json({
          success: false,
          duplicate: true,
          existingPassId: existing.passId,
          message:
            "You're already registered for MORAS LIVE. Each person is eligible for only one pass. Please use your existing QR confirmation.",
          pass: {
            passId: existing.passId,
            customerName: existing.customerName,
            normalizedMobileNumber: existing.normalizedMobileNumber,
            email: existing.email,
            qrToken: existing.qrToken,
            reservationStatus: existing.reservationStatus,
            paymentStatus: existing.paymentStatus,
            ticketStatus: existing.ticketStatus,
            payableAmount: existing.payableAmount,
            cappuccinoIncluded: true,
            cappuccinoRedeemed: existing.cappuccinoRedeemed,
            entryCheckedIn: existing.entryCheckedIn,
            expiresAt: existing.expiresAt,
            createdAt: existing.createdAt,
          },
          qrCodeDataUrl,
          passUrl: qrPayload,
        });
      }

      // If existing reservation is EXPIRED, check inventory to allow reactivation using same passId & QR
      if (existing.reservationStatus === 'EXPIRED') {
        const activeCount = await MorasLiveAudiencePass.countDocuments({
          eventId: 'moras-live-2026',
          reservationStatus: 'RESERVED',
          paymentStatus: { $ne: 'PAID' },
          expiresAt: { $gt: now },
        });
        const paidCount = await MorasLiveAudiencePass.countDocuments({
          eventId: 'moras-live-2026',
          paymentStatus: 'PAID',
        });

        if (activeCount + paidCount >= settings.maximumPasses) {
          return res.status(400).json({
            success: false,
            soldOut: true,
            message: 'ALL 60 MORAS LIVE PASSES HAVE BEEN RESERVED.',
          });
        }

        // Reactivate existing pass holding original pass ID and QR token!
        existing.customerName = cleanName;
        existing.email = cleanEmail;
        existing.reservationStatus = 'RESERVED';
        existing.expiresAt = new Date(Date.now() + settings.reservationExpiryHours * 60 * 60 * 1000);
        await existing.save();

        const qrPayload = buildPassQrPayload(existing.passId, existing.qrToken, req);
        const qrCodeDataUrl = await generateQrCodeDataUrl(qrPayload);

        return res.status(200).json({
          success: true,
          reactivated: true,
          message: 'YOUR MORAS LIVE PASS IS RESERVED!',
          subheading:
            'Your previous reservation has been reactivated. Visit THE MORAS CAFE to complete your payment through UPI or cash and activate your event entry.',
          pass: {
            passId: existing.passId,
            customerName: existing.customerName,
            normalizedMobileNumber: existing.normalizedMobileNumber,
            email: existing.email,
            qrToken: existing.qrToken,
            reservationStatus: existing.reservationStatus,
            paymentStatus: existing.paymentStatus,
            ticketStatus: existing.ticketStatus,
            payableAmount: existing.payableAmount,
            cappuccinoIncluded: true,
            expiresAt: existing.expiresAt,
            createdAt: existing.createdAt,
          },
          qrCodeDataUrl,
          passUrl: qrPayload,
        });
      }
    }

    // 6. Strict Inventory Check: Exactly 60 Passes Max
    const activeReservedCount = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      reservationStatus: 'RESERVED',
      paymentStatus: { $ne: 'PAID' },
      expiresAt: { $gt: now },
    });
    const paidCount = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      paymentStatus: 'PAID',
    });

    if (activeReservedCount + paidCount >= settings.maximumPasses) {
      return res.status(400).json({
        success: false,
        soldOut: true,
        message: 'ALL 60 MORAS LIVE PASSES HAVE BEEN RESERVED.',
      });
    }

    // 7. Generate Single Pass ID and Single QR Token
    const passId = await generateAudiencePassId('moras-live-2026');
    const qrToken = generateQrToken();
    const qrTokenHash = hashQrToken(qrToken);
    const expiresAt = new Date(Date.now() + settings.reservationExpiryHours * 60 * 60 * 1000);

    // 8. Persist Pass to MongoDB
    const pass = await MorasLiveAudiencePass.create({
      passId,
      eventId: 'moras-live-2026',
      customerName: cleanName,
      normalizedMobileNumber: normalizedMobile,
      email: cleanEmail,
      qrToken,
      qrTokenHash,
      reservationStatus: 'RESERVED',
      paymentStatus: 'PENDING',
      ticketStatus: 'INACTIVE',
      payableAmount: settings.priceConfirmed ? settings.approvedPassPrice : settings.proposedPassPrice,
      expiresAt,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    });

    // 9. Generate Single Official QR Data URL Immediately
    const qrPayload = buildPassQrPayload(passId, qrToken, req);
    const qrCodeDataUrl = await generateQrCodeDataUrl(qrPayload);

    return res.status(201).json({
      success: true,
      message: 'YOUR MORAS LIVE PASS IS RESERVED!',
      subheading:
        'Your unique QR pass has been generated. Visit THE MORAS CAFE to complete your payment through UPI or cash and activate your event entry.',
      pass: {
        passId: pass.passId,
        customerName: pass.customerName,
        normalizedMobileNumber: pass.normalizedMobileNumber,
        email: pass.email,
        qrToken: pass.qrToken,
        reservationStatus: pass.reservationStatus,
        paymentStatus: pass.paymentStatus,
        ticketStatus: pass.ticketStatus,
        payableAmount: pass.payableAmount,
        cappuccinoIncluded: true,
        expiresAt: pass.expiresAt,
        createdAt: pass.createdAt,
      },
      qrCodeDataUrl,
      passUrl: qrPayload,
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Reservation error:', error);
    // MongoDB duplicate key error code 11000
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        duplicate: true,
        message:
          "You're already registered for MORAS LIVE. Each person is eligible for only one pass. Please use your existing QR confirmation.",
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Unable to reserve pass right now. Please try again.',
    });
  }
});

// =========================================================================
// 3. PUBLIC: LOOKUP EXISTING PASS (BY PASS ID OR MOBILE)
// GET /api/moras-live/passes/lookup
// =========================================================================
router.get('/lookup', async (req, res) => {
  try {
    const { passId, mobileNumber, token } = req.query;

    const query = { eventId: 'moras-live-2026' };
    if (passId) {
      query.passId = String(passId).trim().toUpperCase();
    } else if (mobileNumber) {
      const norm = normalizeIndianMobile(String(mobileNumber));
      if (!norm) {
        return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
      }
      query.normalizedMobileNumber = norm;
    } else if (token) {
      query.qrTokenHash = hashQrToken(String(token));
    } else {
      return res.status(400).json({ success: false, message: 'passId, mobileNumber, or token required' });
    }

    const pass = await MorasLiveAudiencePass.findOne(query);
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Audience pass not found' });
    }

    const qrPayload = buildPassQrPayload(pass.passId, pass.qrToken, req);
    const qrCodeDataUrl = await generateQrCodeDataUrl(qrPayload);

    return res.json({
      success: true,
      pass: {
        passId: pass.passId,
        customerName: pass.customerName,
        normalizedMobileNumber: pass.normalizedMobileNumber,
        email: pass.email,
        qrToken: pass.qrToken,
        reservationStatus: pass.reservationStatus,
        paymentStatus: pass.paymentStatus,
        ticketStatus: pass.ticketStatus,
        payableAmount: pass.payableAmount,
        paidAmount: pass.paidAmount,
        paymentMethod: pass.paymentMethod,
        cappuccinoIncluded: true,
        cappuccinoRedeemed: pass.cappuccinoRedeemed,
        cappuccinoRedeemedAt: pass.cappuccinoRedeemedAt,
        entryCheckedIn: pass.entryCheckedIn,
        entryCheckedInAt: pass.entryCheckedInAt,
        expiresAt: pass.expiresAt,
        createdAt: pass.createdAt,
      },
      qrCodeDataUrl,
      passUrl: qrPayload,
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Lookup error:', error);
    return res.status(500).json({ success: false, message: 'Failed to look up pass' });
  }
});

// =========================================================================
// 4. STAFF / ADMIN: VERIFY QR OR PASS ID DETAILS
// POST /api/moras-live/passes/verify-qr
// =========================================================================
router.post('/verify-qr', auth, checkRole(['admin', 'kitchen']), async (req, res) => {
  try {
    const { token, qrToken, passId, mobileNumber } = req.body || {};
    let rawToken = token || qrToken;
    let rawPassId = passId;

    // Handle full URL pasted or scanned by camera / hardware scanner
    if (rawToken && (rawToken.includes('token=') || rawToken.startsWith('http'))) {
      try {
        const parsed = new URL(rawToken.startsWith('http') ? rawToken : `https://${rawToken}`);
        const t = parsed.searchParams.get('token');
        const p = parsed.searchParams.get('passId');
        if (t) rawToken = t;
        if (p && !rawPassId) rawPassId = p;
      } catch (e) {}
    }

    if (rawPassId && (rawPassId.includes('token=') || rawPassId.startsWith('http'))) {
      try {
        const parsed = new URL(rawPassId.startsWith('http') ? rawPassId : `https://${rawPassId}`);
        const t = parsed.searchParams.get('token');
        const p = parsed.searchParams.get('passId');
        if (t && !rawToken) rawToken = t;
        if (p) rawPassId = p;
      } catch (e) {}
    }

    let query = { eventId: 'moras-live-2026' };
    if (rawToken && rawToken.length === 64) {
      query.qrTokenHash = hashQrToken(rawToken);
    } else if (rawPassId) {
      const cleanPassId = String(rawPassId).trim();
      const normMobile = normalizeIndianMobile(cleanPassId);
      if (cleanPassId.toUpperCase().startsWith('ML-')) {
        query.passId = cleanPassId.toUpperCase();
      } else if (normMobile) {
        query.normalizedMobileNumber = normMobile;
      } else {
        query.passId = cleanPassId.toUpperCase();
      }
    } else if (mobileNumber) {
      const normMobile = normalizeIndianMobile(String(mobileNumber));
      if (normMobile) {
        query.normalizedMobileNumber = normMobile;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
      }
    } else if (rawToken) {
      query.qrTokenHash = hashQrToken(rawToken);
    } else {
      return res.status(400).json({ success: false, message: 'QR token, passId, or mobile number is required' });
    }

    const pass = await MorasLiveAudiencePass.findOne(query);
    if (!pass) {
      return res.status(404).json({ success: false, message: 'INVALID PASS — Pass not found in system' });
    }

    const settings = await MorasLiveEventSettings.getSettings('moras-live-2026');
    const isExpired = pass.reservationStatus === 'RESERVED' && pass.expiresAt <= new Date();

    const canCollectPayment = settings.priceConfirmed && pass.paymentStatus !== 'PAID' && !isExpired;
    const canRedeemCappuccino = pass.paymentStatus === 'PAID' && !pass.cappuccinoRedeemed;
    const canCheckInEntry = pass.paymentStatus === 'PAID' && pass.ticketStatus === 'ACTIVE' && !pass.entryCheckedIn;

    return res.json({
      success: true,
      pass: {
        passId: pass.passId,
        customerName: pass.customerName,
        mobileNumber: pass.normalizedMobileNumber,
        email: pass.email,
        reservationStatus: isExpired ? 'EXPIRED' : pass.reservationStatus,
        paymentStatus: pass.paymentStatus,
        ticketStatus: pass.ticketStatus,
        payableAmount: settings.priceConfirmed ? settings.approvedPassPrice : settings.proposedPassPrice,
        priceConfirmed: settings.priceConfirmed,
        paidAmount: pass.paidAmount,
        paymentMethod: pass.paymentMethod,
        upiTransactionReference: pass.upiTransactionReference,
        cappuccinoRedeemed: pass.cappuccinoRedeemed,
        cappuccinoRedeemedAt: pass.cappuccinoRedeemedAt,
        entryCheckedIn: pass.entryCheckedIn,
        entryCheckedInAt: pass.entryCheckedInAt,
        expiresAt: pass.expiresAt,
        isExpired,
      },
      permissions: {
        canCollectPayment,
        canRedeemCappuccino,
        canCheckInEntry,
      },
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Verify QR error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify pass' });
  }
});

// =========================================================================
// 5. STAFF / ADMIN: PAYMENT DESK — VERIFY PAYMENT & ACTIVATE PASS (SAME QR)
// POST /api/moras-live/passes/collect-payment
// =========================================================================
router.post('/collect-payment', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { passId, token, qrToken, paymentMethod, upiTransactionReference, amount, notes } = req.body || {};
    const rawToken = token || qrToken;

    let query = { eventId: 'moras-live-2026' };
    if (passId) {
      query.passId = String(passId).trim().toUpperCase();
    } else if (rawToken) {
      query.qrTokenHash = hashQrToken(rawToken);
    } else {
      return res.status(400).json({ success: false, message: 'passId or token is required' });
    }

    const pass = await MorasLiveAudiencePass.findOne(query);
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    // 1. Price Confirmation Guard: Administrator must have explicitly approved ticket price
    const settings = await MorasLiveEventSettings.getSettings('moras-live-2026');
    if (!settings.priceConfirmed) {
      return res.status(400).json({
        success: false,
        message:
          'Ticket price has not yet been approved by the administrator. Payment collection is currently disabled.',
      });
    }

    // 2. Check if already paid
    if (pass.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: `Pass ${pass.passId} is already PAID and active.`,
      });
    }

    // 3. Payment Method validation
    if (!['UPI', 'CASH'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be UPI or CASH.',
      });
    }

    // 4. UPI Reference validation
    const cleanUpiRef = typeof upiTransactionReference === 'string' ? upiTransactionReference.trim() : '';
    if (paymentMethod === 'UPI' && cleanUpiRef.length < 4) {
      return res.status(400).json({
        success: false,
        field: 'upiTransactionReference',
        message: 'Please enter the official UPI transaction reference/UTR number.',
      });
    }

    const confirmedAmount = Number(amount) || settings.approvedPassPrice || 149;
    const verifiedBy = req.user?.username || 'admin';

    // 5. Atomic Update on existing pass document
    pass.paymentStatus = 'PAID';
    pass.reservationStatus = 'CONFIRMED';
    pass.ticketStatus = 'ACTIVE';
    pass.paidAmount = confirmedAmount;
    pass.paymentMethod = paymentMethod;
    pass.upiTransactionReference = cleanUpiRef;
    await pass.save();

    // 6. Record in Payment Ledger
    const paymentId = `PAY-${pass.passId}-${Date.now().toString(36).toUpperCase()}`;
    const paymentRecord = await MorasLivePayment.create({
      paymentId,
      passId: pass.passId,
      amount: confirmedAmount,
      paymentMethod,
      upiTransactionReference: cleanUpiRef,
      paymentStatus: 'PAID',
      verifiedBy,
      verifiedAt: new Date(),
      notes: notes || '',
    });

    const qrPayload = buildPassQrPayload(pass.passId, pass.qrToken, req);

    return res.json({
      success: true,
      message: `Payment of ₹${confirmedAmount} verified via ${paymentMethod}. Pass ${pass.passId} is now ACTIVE!`,
      payment: paymentRecord,
      pass: {
        passId: pass.passId,
        customerName: pass.customerName,
        paymentStatus: pass.paymentStatus,
        reservationStatus: pass.reservationStatus,
        ticketStatus: pass.ticketStatus,
        cappuccinoRedeemed: pass.cappuccinoRedeemed,
        entryCheckedIn: pass.entryCheckedIn,
        passUrl: qrPayload,
      },
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Collect payment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
});

// =========================================================================
// 6. STAFF / ADMIN: CAPPUCCINO REDEMPTION (SAME QR, INDEPENDENT STATUS)
// POST /api/moras-live/passes/redeem-cappuccino
// =========================================================================
router.post('/redeem-cappuccino', auth, checkRole(['admin', 'kitchen']), async (req, res) => {
  try {
    const { passId, token, qrToken, staffId } = req.body || {};
    const rawToken = token || qrToken;

    let query = { eventId: 'moras-live-2026' };
    if (passId) {
      query.passId = String(passId).trim().toUpperCase();
    } else if (rawToken) {
      query.qrTokenHash = hashQrToken(rawToken);
    } else {
      return res.status(400).json({ success: false, message: 'passId or token is required' });
    }

    const pass = await MorasLiveAudiencePass.findOne(query);
    if (!pass) {
      return res.status(404).json({ success: false, message: 'INVALID PASS' });
    }

    if (pass.paymentStatus !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been completed. Complimentary cappuccino is available only after payment verification.',
      });
    }

    if (pass.cappuccinoRedeemed) {
      return res.status(400).json({
        success: false,
        alreadyRedeemed: true,
        message: 'CAPPUCCINO ALREADY REDEEMED',
        redeemedAt: pass.cappuccinoRedeemedAt,
        redeemedBy: pass.cappuccinoRedeemedBy,
      });
    }

    const verifier = staffId || req.user?.username || 'Staff';
    pass.cappuccinoRedeemed = true;
    pass.cappuccinoRedeemedAt = new Date();
    pass.cappuccinoRedeemedBy = verifier;
    await pass.save();

    return res.json({
      success: true,
      message: 'ONE CAPPUCCINO REDEEMED SUCCESSFULLY!',
      customerName: pass.customerName,
      passId: pass.passId,
      cappuccinoRedeemed: true,
      entryCheckedIn: pass.entryCheckedIn,
      redeemedAt: pass.cappuccinoRedeemedAt,
      redeemedBy: pass.cappuccinoRedeemedBy,
      pass: {
        passId: pass.passId,
        customerName: pass.customerName,
        cappuccinoRedeemed: true,
        entryCheckedIn: pass.entryCheckedIn,
        paymentStatus: pass.paymentStatus,
        redeemedAt: pass.cappuccinoRedeemedAt,
        redeemedBy: pass.cappuccinoRedeemedBy,
      },
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Redeem cappuccino error:', error);
    return res.status(500).json({ success: false, message: 'Failed to redeem cappuccino' });
  }
});

// =========================================================================
// 7. STAFF / ADMIN: EVENT ENTRY SCANNER (SAME QR)
// POST /api/moras-live/passes/check-in-entry
// =========================================================================
router.post('/check-in-entry', auth, checkRole(['admin', 'kitchen']), async (req, res) => {
  try {
    const { passId, token, qrToken, staffId } = req.body || {};
    const rawToken = token || qrToken;

    let query = { eventId: 'moras-live-2026' };
    if (passId) {
      query.passId = String(passId).trim().toUpperCase();
    } else if (rawToken) {
      query.qrTokenHash = hashQrToken(rawToken);
    } else {
      return res.status(400).json({ success: false, message: 'passId or token is required' });
    }

    const pass = await MorasLiveAudiencePass.findOne(query);
    if (!pass) {
      return res.status(404).json({ success: false, message: 'INVALID PASS' });
    }

    if (pass.paymentStatus !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'PAYMENT NOT CONFIRMED — ENTRY DENIED',
      });
    }

    if (pass.ticketStatus !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'INVALID PASS — Pass is inactive or has been revoked.',
      });
    }

    if (pass.entryCheckedIn) {
      return res.status(400).json({
        success: false,
        alreadyCheckedIn: true,
        message: 'ALREADY CHECKED IN',
        checkedInAt: pass.entryCheckedInAt,
        checkedInBy: pass.entryCheckedInBy,
        customerName: pass.customerName,
        passId: pass.passId,
      });
    }

    // Atomic update
    const verifier = staffId || req.user?.username || 'Entry Staff';
    const updated = await MorasLiveAudiencePass.findOneAndUpdate(
      { passId: pass.passId, entryCheckedIn: false, paymentStatus: 'PAID' },
      {
        $set: {
          entryCheckedIn: true,
          entryCheckedInAt: new Date(),
          entryCheckedInBy: verifier,
        },
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: 'ENTRY APPROVED',
      customerName: updated.customerName,
      passId: updated.passId,
      entryCheckedIn: true,
      cappuccinoRedeemed: updated.cappuccinoRedeemed,
      checkedInAt: updated.entryCheckedInAt,
      checkedInBy: updated.entryCheckedInBy,
      pass: {
        passId: updated.passId,
        customerName: updated.customerName,
        entryCheckedIn: true,
        cappuccinoRedeemed: updated.cappuccinoRedeemed,
        paymentStatus: updated.paymentStatus,
        checkedInAt: updated.entryCheckedInAt,
        checkedInBy: updated.entryCheckedInBy,
      },
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Event entry check-in error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process event entry' });
  }
});

// =========================================================================
// 8. ADMIN: LIST ALL PASSES (PAGINATION, SEARCH, FILTERS)
// GET /api/moras-live/passes/admin/list
// =========================================================================
router.get('/admin/list', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { search, reservationStatus, paymentStatus, cappuccino, entry, limit = 100, skip = 0 } = req.query;

    const filter = { eventId: 'moras-live-2026' };

    if (reservationStatus && reservationStatus !== 'All') {
      filter.reservationStatus = reservationStatus;
    }
    if (paymentStatus && paymentStatus !== 'All') {
      filter.paymentStatus = paymentStatus;
    }
    if (cappuccino === 'true') filter.cappuccinoRedeemed = true;
    if (cappuccino === 'false') filter.cappuccinoRedeemed = false;
    if (entry === 'true') filter.entryCheckedIn = true;
    if (entry === 'false') filter.entryCheckedIn = false;

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { customerName: regex },
        { normalizedMobileNumber: regex },
        { email: regex },
        { passId: regex },
        { upiTransactionReference: regex },
      ];
    }

    const total = await MorasLiveAudiencePass.countDocuments(filter);
    const passes = await MorasLiveAudiencePass.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip, 10) || 0)
      .limit(parseInt(limit, 10) || 100);

    return res.json({
      success: true,
      total,
      count: passes.length,
      passes,
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Admin list error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve passes list' });
  }
});

// =========================================================================
// 9. ADMIN: PASSES DASHBOARD STATS & LEDGER SUMMARY
// GET /api/moras-live/passes/admin/stats
// =========================================================================
router.get('/admin/stats', auth, checkRole(['admin']), async (req, res) => {
  try {
    const settings = await MorasLiveEventSettings.getSettings('moras-live-2026');
    const now = new Date();

    const activeReservations = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      reservationStatus: 'RESERVED',
      expiresAt: { $gt: now },
    });

    const pendingPayments = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      paymentStatus: 'PENDING',
      reservationStatus: 'RESERVED',
      expiresAt: { $gt: now },
    });

    const confirmedPaidPasses = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      paymentStatus: 'PAID',
    });

    const maxPasses = settings.maximumPasses || 60;
    const availablePasses = Math.max(0, maxPasses - (activeReservations + confirmedPaidPasses));

    const payments = await MorasLivePayment.find({ paymentStatus: 'PAID' });
    let totalAmountCollected = 0;
    let upiCount = 0;
    let upiTotal = 0;
    let cashCount = 0;
    let cashTotal = 0;

    payments.forEach((p) => {
      totalAmountCollected += p.amount;
      if (p.paymentMethod === 'UPI') {
        upiCount++;
        upiTotal += p.amount;
      } else if (p.paymentMethod === 'CASH') {
        cashCount++;
        cashTotal += p.amount;
      }
    });

    const cappuccinosRedeemed = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      cappuccinoRedeemed: true,
    });

    const eventCheckIns = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      entryCheckedIn: true,
    });

    return res.json({
      success: true,
      stats: {
        totalCapacity: maxPasses,
        activeReservations,
        pendingPayments,
        confirmedPaidPasses,
        availablePasses,
        totalAmountCollected,
        upiCollections: upiTotal,
        upiCount,
        cashCollections: cashTotal,
        cashCount,
        cappuccinosRedeemed,
        eventCheckIns,
      },
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate stats' });
  }
});

// =========================================================================
// 10. ADMIN: GET / UPDATE EVENT SETTINGS & PRICE APPROVAL
// GET & PATCH /api/moras-live/passes/admin/settings
// =========================================================================
router.get('/admin/settings', auth, checkRole(['admin']), async (req, res) => {
  try {
    const settings = await MorasLiveEventSettings.getSettings('moras-live-2026');
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve settings' });
  }
});

router.patch('/admin/settings', auth, checkRole(['admin']), async (req, res) => {
  try {
    const {
      approvedPassPrice,
      priceConfirmed,
      proposedPassPrice,
      eventDate,
      eventStartTime,
      eventEndTime,
      venue,
      reservationsEnabled,
      paymentCollectionEnabled,
      reservationExpiryHours,
    } = req.body || {};

    const updateFields = {};
    if (approvedPassPrice !== undefined) updateFields.approvedPassPrice = Number(approvedPassPrice);
    if (proposedPassPrice !== undefined) updateFields.proposedPassPrice = Number(proposedPassPrice);
    if (priceConfirmed !== undefined) updateFields.priceConfirmed = Boolean(priceConfirmed);
    if (eventDate !== undefined) updateFields.eventDate = String(eventDate).trim();
    if (eventStartTime !== undefined) updateFields.eventStartTime = String(eventStartTime).trim();
    if (eventEndTime !== undefined) updateFields.eventEndTime = String(eventEndTime).trim();
    if (venue !== undefined) updateFields.venue = String(venue).trim();
    if (reservationsEnabled !== undefined) updateFields.reservationsEnabled = Boolean(reservationsEnabled);
    if (paymentCollectionEnabled !== undefined) updateFields.paymentCollectionEnabled = Boolean(paymentCollectionEnabled);
    if (reservationExpiryHours !== undefined) updateFields.reservationExpiryHours = Number(reservationExpiryHours);

    const settings = await MorasLiveEventSettings.findOneAndUpdate(
      { eventId: 'moras-live-2026' },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: 'MORAS LIVE event settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

// =========================================================================
// 11. ADMIN: REACTIVATE EXPIRED RESERVATION
// POST /api/moras-live/passes/admin/reactivate
// =========================================================================
router.post('/admin/reactivate', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { passId } = req.body;
    if (!passId) return res.status(400).json({ success: false, message: 'passId is required' });

    const pass = await MorasLiveAudiencePass.findOne({ passId, eventId: 'moras-live-2026' });
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

    const settings = await MorasLiveEventSettings.getSettings('moras-live-2026');
    const now = new Date();

    const activeCount = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      reservationStatus: 'RESERVED',
      paymentStatus: { $ne: 'PAID' },
      expiresAt: { $gt: now },
    });
    const paidCount = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      paymentStatus: 'PAID',
    });

    if (activeCount + paidCount >= settings.maximumPasses) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reactivate: all 60 passes are currently allocated.',
      });
    }

    pass.reservationStatus = 'RESERVED';
    pass.expiresAt = new Date(Date.now() + settings.reservationExpiryHours * 60 * 60 * 1000);
    await pass.save();

    return res.json({
      success: true,
      message: `Pass ${pass.passId} reactivated successfully. Original QR remains active!`,
      pass,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reactivate pass' });
  }
});

// =========================================================================
// 12. ADMIN: CANCEL / REVOKE PASS
// DELETE /api/moras-live/passes/admin/:passId
// =========================================================================
router.delete('/admin/:passId', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { passId } = req.params;
    const pass = await MorasLiveAudiencePass.findOne({ passId, eventId: 'moras-live-2026' });
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

    pass.reservationStatus = 'CANCELLED';
    pass.ticketStatus = 'REVOKED';
    await pass.save();

    return res.json({
      success: true,
      message: `Pass ${passId} (${pass.customerName}) has been cancelled and revoked.`,
      pass,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to cancel pass' });
  }
});

// =========================================================================
// 13. ADMIN: EXPORT PASSES TO CSV
// GET /api/moras-live/passes/admin/export
// =========================================================================
router.get('/admin/export', auth, checkRole(['admin']), async (req, res) => {
  try {
    const passes = await MorasLiveAudiencePass.find({ eventId: 'moras-live-2026' }).sort({ passId: 1 });

    const headers = [
      'Pass ID',
      'Customer Name',
      'Mobile Number',
      'Email',
      'Reservation Status',
      'Payment Status',
      'Ticket Status',
      'Payable Amount (INR)',
      'Paid Amount (INR)',
      'Payment Method',
      'UPI Ref / UTR',
      'Cappuccino Redeemed',
      'Cappuccino Redeemed At',
      'Event Checked In',
      'Checked In At',
      'Expires At',
      'Created At',
    ];

    const rows = passes.map((p) => [
      escapeCsv(p.passId),
      escapeCsv(p.customerName),
      escapeCsv(p.normalizedMobileNumber),
      escapeCsv(p.email),
      escapeCsv(p.reservationStatus),
      escapeCsv(p.paymentStatus),
      escapeCsv(p.ticketStatus),
      escapeCsv(p.payableAmount),
      escapeCsv(p.paidAmount),
      escapeCsv(p.paymentMethod),
      escapeCsv(p.upiTransactionReference),
      escapeCsv(p.cappuccinoRedeemed ? 'YES' : 'NO'),
      escapeCsv(p.cappuccinoRedeemedAt ? new Date(p.cappuccinoRedeemedAt).toISOString() : ''),
      escapeCsv(p.entryCheckedIn ? 'YES' : 'NO'),
      escapeCsv(p.entryCheckedInAt ? new Date(p.entryCheckedInAt).toISOString() : ''),
      escapeCsv(p.expiresAt ? new Date(p.expiresAt).toISOString() : ''),
      escapeCsv(p.createdAt ? new Date(p.createdAt).toISOString() : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="moras_live_audience_passes_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('[MORAS LIVE PASSES] CSV export error:', error);
    return res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
});

module.exports = router;
