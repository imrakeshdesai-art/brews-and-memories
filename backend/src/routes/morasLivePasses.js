const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { checkPermission } = require('../middleware/checkPermission');
const { MorasLiveAudiencePass } = require('../models/MorasLiveAudiencePass');
const { MorasLivePayment } = require('../models/MorasLivePayment');
const { MorasLiveEventSettings } = require('../models/MorasLiveEventSettings');
const { generateAudiencePassId } = require('../utils/generateAudiencePassId');
const { sendMorasLivePassEmail } = require('../utils/email');
const {
  generateQrToken,
  hashQrToken,
  generateQrCodeDataUrl,
  buildPassQrPayload,
} = require('../utils/qrPassCrypto');

// Helper: Generate high-entropy access token & SHA-256 hash
function generateAccessToken() {
  return crypto.randomBytes(32).toString('hex'); // 64-char random hex
}
function hashAccessToken(token) {
  return crypto.createHash('sha256').update(String(token).trim()).digest('hex');
}

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

    // Check if reservation cutoff has passed
    const isPastCutoff = settings.reservationCutoffDate && now > new Date(settings.reservationCutoffDate);
    const reservationsEnabled = settings.reservationsEnabled && !isPastCutoff;

    // Concurrency-safe count calculation:
    // Active reservations: reservationStatus in ['ACTIVE', 'RESERVED', 'CONFIRMED'], paymentStatus != 'PAID'
    const activeReservedQuery = {
      eventId: 'moras-live-2026',
      reservationStatus: { $in: ['ACTIVE', 'RESERVED', 'CONFIRMED'] },
      paymentStatus: { $ne: 'PAID' },
    };
    if (settings.reservationCutoffDate) {
      activeReservedQuery.$or = [
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ];
    }
    const activeReservedCount = await MorasLiveAudiencePass.countDocuments(activeReservedQuery);

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
        proposedPassPrice: 149,
        approvedPassPrice: 149,
        priceConfirmed: true,
        reservationsEnabled,
        paymentCollectionEnabled: true,
        reservationCutoffDate: settings.reservationCutoffDate,
        cappuccinoIncluded: true,
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

    // 4. Check Event Settings & Cutoff
    const settings = await MorasLiveEventSettings.getSettings('moras-live-2026');
    const now = new Date();
    if (settings.reservationCutoffDate && now > new Date(settings.reservationCutoffDate)) {
      return res.status(400).json({
        success: false,
        message: 'Pass reservations for MORAS LIVE have ended as the reservation cutoff date has passed.',
      });
    }
    if (!settings.reservationsEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Online pass reservations are currently paused by the administrator.',
      });
    }

    // 5. Duplicate Check: One Mobile Number = One Pass
    const existing = await MorasLiveAudiencePass.findOne({
      eventId: 'moras-live-2026',
      normalizedMobileNumber: normalizedMobile,
    });

    if (existing && existing.reservationStatus !== 'CANCELLED') {
      return res.status(409).json({
        success: false,
        duplicate: true,
        existingPassId: existing.passId,
        message:
          "You're already registered for MORAS LIVE. Each person is eligible for only one pass. Please check your registered email or present your original pass at the event entrance.",
      });
    }

    // 6. Strict Inventory Check: Exactly 60 Passes Max
    const activeReservedCount = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      reservationStatus: { $in: ['ACTIVE', 'RESERVED', 'CONFIRMED'] },
      paymentStatus: { $ne: 'PAID' },
    });
    const paidCount = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      paymentStatus: 'PAID',
    });

    const maxPasses = settings.maximumPasses || 60;
    if (activeReservedCount + paidCount >= maxPasses) {
      return res.status(400).json({
        success: false,
        soldOut: true,
        message: 'ALL 60 MORAS LIVE PASSES HAVE BEEN RESERVED.',
      });
    }

    // 7. Cryptographically Random Tokens
    const passId = await generateAudiencePassId('moras-live-2026');
    const qrToken = generateQrToken();
    const qrTokenHash = hashQrToken(qrToken);
    const emailAccessToken = generateAccessToken();
    const emailAccessTokenHash = hashAccessToken(emailAccessToken);
    const expiresAt = settings.reservationCutoffDate || null;

    // 8. Persist Pass to MongoDB First
    const pass = await MorasLiveAudiencePass.create({
      passId,
      eventId: 'moras-live-2026',
      customerName: cleanName,
      normalizedMobileNumber: normalizedMobile,
      email: cleanEmail,
      qrToken,
      qrTokenHash,
      emailAccessTokenHash,
      reservationStatus: 'ACTIVE',
      paymentStatus: 'PENDING',
      ticketStatus: 'ACTIVE',
      payableAmount: 149,
      expiresAt,
      emailDeliveryStatus: 'PENDING',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    });

    // 9. Generate Single Official QR Data URL Immediately
    const qrPayload = buildPassQrPayload(passId, qrToken, req);
    const qrCodeDataUrl = await generateQrCodeDataUrl(qrPayload);

    // Derive secure access URL for the email link
    let origin = 'https://themorascafe.in';
    if (req.headers && req.headers['x-forwarded-host']) {
      const proto = req.headers['x-forwarded-proto'] || 'https';
      origin = `${proto}://${req.headers['x-forwarded-host']}`;
    } else if (req.headers && req.headers.host) {
      const proto = req.protocol || 'https';
      origin = `${proto}://${req.headers.host}`;
    }
    const secureAccessUrl = `${origin}/moras-live/passes?passId=${pass.passId}&access=${emailAccessToken}`;

    // 10. Respond to user immediately with QR code confirmation
    res.status(201).json({
      success: true,
      message: 'RESERVATION CONFIRMED — PAYMENT DUE AT EVENT ENTRY',
      subheading:
        'Your MORAS LIVE pass is reserved. Please present your QR code at the event entrance and pay ₹149 by cash or UPI to receive entry.',
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
      accessToken: emailAccessToken,
    });

    // 11. Asynchronous Isolated Email Dispatch (never blocks or rolls back reservation)
    setImmediate(async () => {
      try {
        const emailRes = await sendMorasLivePassEmail({
          pass: {
            ...pass.toObject(),
            venue: settings.venue,
            eventDate: settings.eventDate,
            eventStartTime: settings.eventStartTime,
          },
          qrDataUrl: qrCodeDataUrl,
          qrPayload,
          secureAccessUrl,
        });

        const isSent = Boolean(emailRes && emailRes.success);
        await MorasLiveAudiencePass.updateOne(
          { _id: pass._id },
          {
            $set: {
              emailDeliveryStatus: isSent ? 'SENT' : 'FAILED',
              'emailDeliveryDetails.provider': emailRes?.method || (isSent ? 'brevo_https' : 'none'),
              'emailDeliveryDetails.messageId': emailRes?.messageId || '',
              'emailDeliveryDetails.attemptedAt': new Date(),
              'emailDeliveryDetails.errorReason': isSent ? '' : (emailRes?.error || 'Email delivery failed'),
              'emailDeliveryDetails.retryCount': 1,
            },
          }
        );
      } catch (err) {
        console.error('[MORAS LIVE] Background email dispatch failed:', err.message);
        await MorasLiveAudiencePass.updateOne(
          { _id: pass._id },
          {
            $set: {
              emailDeliveryStatus: 'FAILED',
              'emailDeliveryDetails.errorReason': err.message,
              'emailDeliveryDetails.attemptedAt': new Date(),
            },
          }
        ).catch(() => {});
      }
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Reservation error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        duplicate: true,
        message:
          "You're already registered for MORAS LIVE. Each person is eligible for only one pass. Please check your registered email or present your original pass at the event entrance.",
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Unable to reserve pass right now. Please try again.',
    });
  }
});

// =========================================================================
// 3. SECURE PASS VIEW (AUTHENTICATED VIA HIGH-ENTROPY EMAIL TOKEN)
// GET /api/moras-live/passes/secure-view
// =========================================================================
router.get('/secure-view', async (req, res) => {
  try {
    const { passId, access, token } = req.query;
    if (!passId || (!access && !token)) {
      return res.status(400).json({
        success: false,
        message: 'passId and access or QR token are required to securely view this pass.',
      });
    }

    const cleanPassId = String(passId).trim().toUpperCase();
    const query = {
      eventId: 'moras-live-2026',
      passId: cleanPassId,
    };

    if (access) {
      query.emailAccessTokenHash = hashAccessToken(String(access));
    } else if (token) {
      query.qrTokenHash = hashQrToken(String(token));
    }

    const pass = await MorasLiveAudiencePass.findOne(query);

    if (!pass) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired secure access token. Please access your pass through your official email confirmation link.',
      });
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
    console.error('[MORAS LIVE PASSES] Secure view error:', error);
    return res.status(500).json({ success: false, message: 'Failed to securely retrieve pass' });
  }
});

// =========================================================================
// 3B. NATIVE QR IMAGE RENDER (HTTPS PNG STREAM FOR EMAIL & PUBLIC PREVIEWS)
// GET /api/moras-live/passes/qr-image
// =========================================================================
router.get('/qr-image', async (req, res) => {
  try {
    const { passId, token } = req.query;
    if (!passId || !token) {
      return res.status(400).send('passId and token are required');
    }
    const cleanPassId = String(passId).trim().toUpperCase();
    const pass = await MorasLiveAudiencePass.findOne({
      eventId: 'moras-live-2026',
      passId: cleanPassId,
      qrTokenHash: hashQrToken(String(token)),
    });
    if (!pass) {
      return res.status(404).send('Pass not found or invalid token');
    }
    const qrPayload = buildPassQrPayload(pass.passId, pass.qrToken, req);
    const QRCode = require('qrcode');
    const buffer = await QRCode.toBuffer(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#123F3D',
        light: '#FFFFFF',
      },
    });
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (err) {
    console.error('[MORAS LIVE PASSES] QR image render error:', err);
    return res.status(500).send('Failed to render QR image');
  }
});

// =========================================================================
// 3C. DEPRECATED PUBLIC LOOKUP (DISABLED FOR PASS PRIVACY & ANTI-SCRAPING)
// GET /api/moras-live/passes/lookup
// =========================================================================
router.get('/lookup', async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Public unauthenticated pass lookup is disabled for security and privacy. Please open your pass from your confirmation email or present your pass at the event entrance.',
  });
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
router.post('/collect-payment', auth, checkPermission('moras_live_payment_collect'), async (req, res) => {
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

    // 1. Check if already paid
    if (pass.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: `Pass ${pass.passId} is already PAID.`,
      });
    }

    // 2. Payment Method validation
    if (!['UPI', 'CASH'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be UPI or CASH.',
      });
    }

    // 3. UPI Reference validation
    const cleanUpiRef = typeof upiTransactionReference === 'string' ? upiTransactionReference.trim() : '';
    if (paymentMethod === 'UPI' && cleanUpiRef.length < 4) {
      return res.status(400).json({
        success: false,
        field: 'upiTransactionReference',
        message: 'Please enter the official UPI transaction reference/UTR number.',
      });
    }

    const confirmedAmount = Number(amount) || pass.payableAmount || 149;
    const verifiedBy = req.user?.username || req.user?.email || 'admin';

    // 4. Atomic Update on existing pass document
    pass.paymentStatus = 'PAID';
    pass.reservationStatus = 'CONFIRMED';
    pass.ticketStatus = 'ACTIVE';
    pass.paidAmount = confirmedAmount;
    pass.paymentMethod = paymentMethod;
    pass.upiTransactionReference = cleanUpiRef;
    pass.paymentRecordedBy = verifiedBy;
    pass.paymentRecordedAt = new Date();
    await pass.save();

    // 5. Record in Payment Ledger
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
      message: `Payment of ₹${confirmedAmount} verified via ${paymentMethod}. Pass ${pass.passId} is confirmed!`,
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
router.post('/redeem-cappuccino', auth, checkPermission('moras_live_cappuccino_redeem'), async (req, res) => {
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
        message: 'Payment has not been completed. Complimentary cappuccino is available only after entrance payment.',
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

    const verifier = staffId || req.user?.username || req.user?.email || 'Barista Staff';
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
router.post('/check-in-entry', auth, checkPermission('moras_live_entry_checkin'), async (req, res) => {
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

    // 1. Duplicate check: Already Checked In?
    if (pass.entryCheckedIn) {
      return res.status(409).json({
        success: false,
        alreadyCheckedIn: true,
        message: 'ALREADY CHECKED IN',
        checkedInAt: pass.entryCheckedInAt,
        checkedInBy: pass.entryCheckedInBy,
        customerName: pass.customerName,
        passId: pass.passId,
      });
    }

    // 2. Payment check
    if (pass.paymentStatus !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'PAYMENT NOT CONFIRMED — Payment of ₹149 is due at the event entrance before admission.',
      });
    }

    if (pass.ticketStatus !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'INVALID PASS — Pass is inactive or has been revoked.',
      });
    }

    // Atomic update
    const verifier = staffId || req.user?.username || req.user?.email || 'Door Staff';
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
// 7B. STAFF / ADMIN: COMBINED ENTRANCE DESK ADMISSION (PAYMENT + CHECK-IN)
// POST /api/moras-live/passes/entrance-admit
// =========================================================================
router.post('/entrance-admit', auth, checkPermission('moras_live_entry_checkin'), async (req, res) => {
  try {
    const { passId, token, qrToken, paymentMethod, upiTransactionReference, staffId } = req.body || {};
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

    // 1. Duplicate check: Already Checked In?
    if (pass.entryCheckedIn) {
      return res.status(409).json({
        success: false,
        alreadyCheckedIn: true,
        message: 'ALREADY CHECKED IN',
        checkedInAt: pass.entryCheckedInAt,
        checkedInBy: pass.entryCheckedInBy,
        customerName: pass.customerName,
        passId: pass.passId,
      });
    }

    if (pass.ticketStatus === 'REVOKED' || pass.reservationStatus === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'INVALID PASS — Pass is inactive or has been revoked.',
      });
    }

    const verifier = staffId || req.user?.username || req.user?.email || 'Entrance Desk';

    // 2. If Payment is Pending, collect payment
    if (pass.paymentStatus !== 'PAID') {
      if (!['UPI', 'CASH'].includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: 'Payment of ₹149 is required for entrance admission. Please select CASH or UPI.',
        });
      }

      const cleanUpiRef = typeof upiTransactionReference === 'string' ? upiTransactionReference.trim() : '';
      if (paymentMethod === 'UPI' && cleanUpiRef.length < 4) {
        return res.status(400).json({
          success: false,
          field: 'upiTransactionReference',
          message: 'Please enter the official UPI transaction reference/UTR number.',
        });
      }

      const confirmedAmount = pass.payableAmount || 149;
      pass.paymentStatus = 'PAID';
      pass.reservationStatus = 'CONFIRMED';
      pass.ticketStatus = 'ACTIVE';
      pass.paidAmount = confirmedAmount;
      pass.paymentMethod = paymentMethod;
      pass.upiTransactionReference = cleanUpiRef;
      pass.paymentRecordedBy = verifier;
      pass.paymentRecordedAt = new Date();

      const paymentId = `PAY-${pass.passId}-${Date.now().toString(36).toUpperCase()}`;
      await MorasLivePayment.create({
        paymentId,
        passId: pass.passId,
        amount: confirmedAmount,
        paymentMethod,
        upiTransactionReference: cleanUpiRef,
        paymentStatus: 'PAID',
        verifiedBy: verifier,
        verifiedAt: new Date(),
        notes: 'Collected at event entrance desk',
      });
    }

    // 3. Mark Entry Checked In
    pass.entryCheckedIn = true;
    pass.entryCheckedInAt = new Date();
    pass.entryCheckedInBy = verifier;
    await pass.save();

    return res.json({
      success: true,
      message: 'ADMISSION GRANTED — ENTRY CHECKED IN',
      customerName: pass.customerName,
      passId: pass.passId,
      entryCheckedIn: true,
      cappuccinoRedeemed: pass.cappuccinoRedeemed,
      paymentStatus: pass.paymentStatus,
      paidAmount: pass.paidAmount,
      paymentMethod: pass.paymentMethod,
      checkedInAt: pass.entryCheckedInAt,
      checkedInBy: pass.entryCheckedInBy,
      pass: {
        passId: pass.passId,
        customerName: pass.customerName,
        entryCheckedIn: true,
        cappuccinoRedeemed: pass.cappuccinoRedeemed,
        paymentStatus: pass.paymentStatus,
        paidAmount: pass.paidAmount,
        checkedInAt: pass.entryCheckedInAt,
        checkedInBy: pass.entryCheckedInBy,
      },
    });
  } catch (error) {
    console.error('[MORAS LIVE PASSES] Entrance admit error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process entrance admission' });
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

    const activeReservations = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      reservationStatus: { $in: ['ACTIVE', 'RESERVED', 'CONFIRMED'] },
      paymentStatus: { $ne: 'PAID' },
    });

    const pendingPayments = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      paymentStatus: 'PENDING',
      reservationStatus: { $in: ['ACTIVE', 'RESERVED', 'CONFIRMED'] },
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
      const amt = Number(p.amount) || 0;
      totalAmountCollected += amt;
      if (p.paymentMethod === 'UPI') {
        upiCount++;
        upiTotal += amt;
      } else if (p.paymentMethod === 'CASH') {
        cashCount++;
        cashTotal += amt;
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

    const emailsSent = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      emailDeliveryStatus: 'SENT',
    });

    const emailsFailed = await MorasLiveAudiencePass.countDocuments({
      eventId: 'moras-live-2026',
      emailDeliveryStatus: 'FAILED',
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
        emailsSent,
        emailsFailed,
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
      reservationCutoffDate,
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
    if (reservationCutoffDate !== undefined) updateFields.reservationCutoffDate = reservationCutoffDate ? new Date(reservationCutoffDate) : null;

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
