const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const router = express.Router();
const Reservation = require('../models/Reservation');
const AuditLog = require('../models/AuditLog');
const UpiPaymentLog = require('../models/UpiPaymentLog');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { sendReservationEmail } = require('../utils/email');

// ── UPI Notification Parser ──────────────────────────────────────────────────
function parseUpiNotification(text = '', title = '') {
  const fullText = `${title} ${text}`.trim();
  
  // 1. Extract amount (e.g. ₹59, ₹199, ₹10, Rs. 59, received 59)
  let amount = 59;
  const amountMatch = fullText.match(/(?:₹|Rs\.?|INR)\s*([0-9]+(?:\.[0-9]+)?)/i) || 
                      fullText.match(/received\s+([0-9]+(?:\.[0-9]+)?)/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
  }

  // 2. Extract 12-digit UTR / Reference ID
  let utr = '';
  const utrMatch = fullText.match(/(?:UTR|Ref|Txn|Reference|UPI Ref|ID)[:\s\-#]*([A-Za-z0-9]{8,16})/i) ||
                   fullText.match(/\b(\d{12})\b/);
  if (utrMatch) {
    utr = utrMatch[1];
  }

  // 3. Extract sender name (e.g. "from ANAND KULKARNI")
  let sender = '';
  const senderMatch = fullText.match(/from\s+([A-Za-z0-9\s]+?)(?:\.|\s+UTR|\s+Txn|\s+on|\s*\(|$)/i);
  if (senderMatch) {
    sender = senderMatch[1].trim();
  }

  return { amount, utr, sender, fullText };
}

// ==================== 1. REAL-TIME PHONEPE / UPI WEBHOOK ====================
// POST /api/reservations/webhook/upi
// Webhook for incoming PhonePe / UPI credit alerts
// Strictly requires x-webhook-token header (rejects query and body tokens)
router.post('/webhook/upi', async (req, res) => {
  try {
    const expectedToken = process.env.UPI_WEBHOOK_SECRET;
    if (!expectedToken) {
      console.error('[UPI Webhook] Misconfiguration: UPI_WEBHOOK_SECRET is not configured on the server');
      return res.status(500).json({ message: 'Webhook authentication unavailable' });
    }

    const token = req.headers['x-webhook-token'];
    if (!token || typeof token !== 'string') {
      console.warn('[UPI Webhook] Rejected: Missing or invalid x-webhook-token header');
      return res.status(401).json({ message: 'Missing or invalid webhook authentication header' });
    }

    let authorized = false;
    try {
      const tokenBuf = Buffer.from(token, 'utf8');
      const expectedBuf = Buffer.from(expectedToken, 'utf8');
      if (tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
        authorized = true;
      }
    } catch (e) {
      authorized = false;
    }

    if (!authorized) {
      console.warn('[UPI Webhook] Rejected: Unauthorized webhook token mismatch');
      return res.status(401).json({ message: 'Unauthorized webhook request' });
    }

    let rawText = '';
    let rawTitle = '';
    let explicitAmount = null;
    let explicitUtr = null;
    let explicitSender = null;

    if (typeof req.body === 'object' && req.body !== null) {
      rawText = req.body.text || req.body.message || req.body.body || '';
      rawTitle = req.body.title || '';
      explicitAmount = req.body.amount;
      explicitUtr = req.body.utr;
      explicitSender = req.body.sender;
    } else if (typeof req.body === 'string') {
      rawText = req.body;
    }

    if (!rawText && !explicitUtr && !explicitAmount) {
      return res.status(400).json({ message: 'Missing notification payload' });
    }

    const parsed = parseUpiNotification(rawText, rawTitle);
    const amount = explicitAmount ? Number(explicitAmount) : parsed.amount;
    const utr = explicitUtr || parsed.utr;
    const sender = explicitSender || parsed.sender;

    console.log(`[UPI Webhook] 🔔 Incoming PhonePe Alert — Amount: ₹${amount}, UTR: ${utr || 'N/A'}, Sender: ${sender || 'N/A'}`);

    // Log the incoming payment
    const paymentLog = await UpiPaymentLog.create({
      rawTitle: rawTitle || '',
      rawText: rawText || JSON.stringify(req.body || {}),
      amount,
      utr,
      sender,
      matched: false,
    });

    // ── MATCHING LOGIC ──────────────────────────────────────────────────────
    let matchedReservation = null;

    // Strategy A: Match by exact 12-digit UTR if available
    if (utr) {
      matchedReservation = await Reservation.findOne({
        upiRef: utr,
        status: { $ne: 'cancelled' },
      });
    }

    // Strategy B: Match pending reservation created in the last 30 minutes
    if (!matchedReservation) {
      const windowStart = new Date(Date.now() - 30 * 60 * 1000);

      const pendingList = await Reservation.find({
        status: 'pending',
        amount: amount,
        createdAt: { $gte: windowStart },
      }).sort({ createdAt: -1 });

      if (pendingList.length > 0) {
        if (sender) {
          const senderLower = sender.toLowerCase();
          const nameMatch = pendingList.find((r) =>
            senderLower.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(senderLower)
          );
          matchedReservation = nameMatch || pendingList[0];
        } else {
          matchedReservation = pendingList[0];
        }
      }
    }

    // If matched, AUTO-CONFIRM immediately and dispatch email!
    if (matchedReservation) {
      matchedReservation.status = 'confirmed';
      matchedReservation.paymentStatus = 'verified';
      matchedReservation.confirmedAt = new Date();
      if (utr && !matchedReservation.upiRef) {
        matchedReservation.upiRef = utr;
      }
      await matchedReservation.save();

      paymentLog.matchedReservationId = matchedReservation._id;
      paymentLog.matched = true;
      await paymentLog.save();

      console.log(`[UPI Webhook] 🎯 Auto-Matched & Confirmed Reservation #${matchedReservation._id}!`);

      if (!matchedReservation.confirmationEmailSent) {
        sendReservationEmail(matchedReservation)
          .then(async (emailRes) => {
            if (emailRes && emailRes.success) {
              await Reservation.findByIdAndUpdate(matchedReservation._id, { confirmationEmailSent: true });
              console.log(`[UPI Webhook] ✉️ Confirmation email successfully sent to ${matchedReservation.email}`);
            }
          })
          .catch((err) => console.error('[UPI Webhook] Email error:', err.message));
      }

      return res.json({
        success: true,
        matched: true,
        reservationId: matchedReservation._id,
        bookingRef: `#TMC-RES-${String(matchedReservation._id).slice(-6).toUpperCase()}`,
      });
    }

    return res.json({
      success: true,
      matched: false,
      message: 'Payment notification recorded. Standing by for diner booking match.',
    });

  } catch (err) {
    console.error('[UPI Webhook] Processing error:', err);
    res.status(500).json({ message: 'Webhook processing failed', error: err.message });
  }
});

// ==================== 2. CREATE RESERVATION (PUBLIC) ====================
// POST /api/reservations
// Public reservation creation: isTest strictly defaults to false (client inputs ignored)
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      guests, 
      date, 
      time, 
      notes, 
      birthdayPerson, 
      eventType, 
      amount,
      packagePrice,
      remainingBalance 
    } = req.body;

    if (!name || !phone || !date || !time) {
      return res.status(400).json({ message: 'Missing required fields (Name, Phone, Date, Time)' });
    }

    let customerEmail = (email || '').trim().toLowerCase();
    if (customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
      }
    } else {
      // Default fallback email if customer leaves email blank (not required per user request)
      customerEmail = `${phone.replace(/\D/g, '')}@guest.themorascafe.in`;
    }

    const cleanedPhone = String(phone).replace(/\D/g, '');
    const normalizedPhone = (cleanedPhone.length === 12 && cleanedPhone.startsWith('91'))
      ? cleanedPhone.slice(2)
      : cleanedPhone;

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Invalid 10-digit phone number' });
    }

    if (Number(guests) < 1) {
      return res.status(400).json({ message: 'Number of people must be at least 1' });
    }

    const bookingAmount = Number(amount) || 59;
    const pkgPrice = Number(packagePrice) || 199;
    const remBalance = Number(remainingBalance) || (pkgPrice - bookingAmount);

    // Step 1: Create pending reservation (isTest strictly false; public clients cannot set test flags)
    const newReservation = await Reservation.create({
      name: name.trim(),
      email: customerEmail,
      phone: normalizedPhone,
      guests: Number(guests),
      date,
      time,
      notes: (notes || '').trim(),
      birthdayPerson: (birthdayPerson || '').trim(),
      eventType: eventType || 'birthday',
      amount: bookingAmount,
      packagePrice: pkgPrice,
      remainingBalance: remBalance,
      paymentMethod: 'UPI',
      paymentStatus: 'pending_payment',
      upiRef: '',
      status: 'pending',
      confirmedAt: null,
      confirmationEmailSent: false,
      isTest: false,
      createdAt: new Date(),
    });

    res.status(201).json(newReservation);

  } catch (error) {
    console.error('Reservation creation error:', error);
    res.status(500).json({ message: 'Could not submit reservation. Please try again.' });
  }
});

// ==================== 4. VERIFY PAYMENT / SUBMIT UTR ====================
// PATCH /api/reservations/:id/submit-utr
router.patch('/:id/submit-utr', async (req, res) => {
  try {
    const { id } = req.params;
    const { upiRef } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // If webhook already confirmed in background, return immediately
    if (reservation.status === 'confirmed') {
      return res.json(reservation);
    }

    const cleanUpiRef = (upiRef || '').trim();
    let matchedLog = null;

    // 1. If diner typed a 12-digit UTR, check if that UTR was recorded in UpiPaymentLog
    if (cleanUpiRef && cleanUpiRef.length >= 6) {
      matchedLog = await UpiPaymentLog.findOne({
        utr: cleanUpiRef,
        matched: false,
      });
    }

    // 2. If no UTR was typed, check if an unmatched payment arrived for this customer in the last 15 mins
    if (!matchedLog) {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const recentLogs = await UpiPaymentLog.find({
        matched: false,
        amount: reservation.amount || 59,
        createdAt: { $gte: fifteenMinsAgo },
      }).sort({ createdAt: -1 });

      if (recentLogs.length > 0) {
        const customerNameLower = reservation.name.toLowerCase();
        const nameMatch = recentLogs.find((l) =>
          l.sender && (l.sender.toLowerCase().includes(customerNameLower) || customerNameLower.includes(l.sender.toLowerCase()))
        );
        matchedLog = nameMatch || recentLogs[0];
      }
    }

    // 🚨 STRICT PAYMENT ENFORCEMENT:
    // If no real PhonePe payment was received, DO NOT CONFIRM!
    if (!matchedLog) {
      const advanceRequired = reservation.amount || 59;
      return res.status(400).json({
        message: `Advance payment of ₹${advanceRequired} not detected yet. If you already completed the transfer in PhonePe/GPay, please wait 5–10 seconds for the bank notification, or enter your 12-digit UTR reference.`
      });
    }

    // Valid payment verified! Confirm the booking.
    reservation.upiRef = cleanUpiRef || matchedLog.utr || 'VERIFIED_VIA_PHONEPE';
    reservation.status = 'confirmed';
    reservation.paymentStatus = 'verified';
    reservation.confirmedAt = new Date();
    await reservation.save();

    matchedLog.matchedReservationId = reservation._id;
    matchedLog.matched = true;
    await matchedLog.save();

    // Dispatch confirmation email
    if (!reservation.confirmationEmailSent) {
      sendReservationEmail(reservation)
        .then(async (emailRes) => {
          if (emailRes && emailRes.success) {
            await Reservation.findByIdAndUpdate(reservation._id, { confirmationEmailSent: true });
            console.log(`[Reservation] Confirmation email dispatched to ${reservation.email}`);
          }
        })
        .catch(console.error);
    }

    res.json(reservation);

  } catch (err) {
    console.error('Submit UTR error:', err);
    res.status(500).json({ message: 'Could not verify transaction' });
  }
});

// ==================== 5. GET ALL RESERVATIONS (ADMIN) ====================
// GET /api/reservations (requires auth)
router.get('/', auth, checkRole(['admin']), async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    console.error('Fetch reservations error:', error);
    res.status(500).json({ message: 'Could not fetch reservations' });
  }
});

// ==================== 6. UPDATE RESERVATION STATUS (ADMIN) ====================
// PATCH /api/reservations/:id (requires auth)
router.patch('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resendEmail } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid reservation status' });
    }

    const updated = await Reservation.findByIdAndUpdate(
      id,
      { 
        status,
        ...(status === 'confirmed' && { paymentStatus: 'verified', confirmedAt: new Date() })
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (status === 'confirmed' && (resendEmail || !updated.confirmationEmailSent)) {
      sendReservationEmail(updated)
        .then(async (emailRes) => {
          if (emailRes && emailRes.success) {
            await Reservation.findByIdAndUpdate(id, { confirmationEmailSent: true });
          }
        })
        .catch(console.error);
    }

    res.json(updated);

  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ message: 'Could not update reservation' });
  }
});

// ==================== 7. RE-SEND CONFIRMATION EMAIL (ADMIN) ====================
// POST /api/reservations/:id/resend-email (requires auth)
router.post('/:id/resend-email', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (!reservation.email) {
      return res.status(400).json({ message: 'No email address recorded for this reservation' });
    }

    const emailResult = await sendReservationEmail(reservation);
    if (emailResult.success) {
      await Reservation.findByIdAndUpdate(id, { confirmationEmailSent: true });
      return res.json({ success: true, message: `Confirmation email re-sent to ${reservation.email}` });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: 'Could not send confirmation email', 
        details: emailResult.errors || emailResult.error 
      });
    }
  } catch (error) {
    console.error('Resend reservation email error:', error);
    res.status(500).json({ message: 'Internal server error while sending email' });
  }
});

// ==================== 8. DELETE TEST RESERVATIONS (ADMIN) ====================
// DELETE /api/reservations/clean-all-tests (requires auth)
// Deletes ONLY verified test reservations (strictly isTest: true), preserving genuine customer bookings
router.delete('/clean-all-tests', auth, checkRole(['admin']), async (req, res) => {
  const adminEmail = req.user?.username || req.user?.email || 'admin';
  const timestamp = new Date().toISOString();

  try {
    const { targetIds } = req.body || {};
    let recordsToDelete = [];

    if (Array.isArray(targetIds) && targetIds.length > 0) {
      // 1. Explicit IDs supplied: load EVERY requested record
      const cleanIds = targetIds.map(String).filter(Boolean);
      recordsToDelete = await Reservation.find({ _id: { $in: cleanIds } });

      // Verify that EVERY requested record exists
      if (recordsToDelete.length !== cleanIds.length) {
        console.warn(`[AUDIT - RESERVATIONS CLEANUP FAILED] Admin ${adminEmail} requested ${cleanIds.length} IDs, found ${recordsToDelete.length}. Aborting.`);
        return res.status(404).json({
          success: false,
          message: 'Operation rejected: One or more requested reservation records were not found.',
        });
      }

      // Verify that EVERY record has isTest: true
      const genuineRecord = recordsToDelete.find((r) => r.isTest !== true);
      if (genuineRecord) {
        console.warn(`[AUDIT - RESERVATIONS CLEANUP BLOCKED] Admin ${adminEmail} attempted deletion of genuine reservation #${genuineRecord._id}. Entire operation aborted.`);
        await AuditLog.create({
          admin: adminEmail,
          operationType: 'DELETE_TEST_RESERVATIONS',
          targetRecordIds: cleanIds,
          deletedCount: 0,
          operationResult: 'BLOCKED',
          metadata: { reason: `Genuine reservation #${genuineRecord._id} targeted; operation aborted.` },
        }).catch((err) => console.error('[AUDIT LOG WRITE ERROR]', err));

        return res.status(403).json({
          success: false,
          message: `Operation rejected: Reservation #${genuineRecord._id} is a genuine customer record and cannot be deleted. Entire operation aborted.`,
        });
      }
    } else {
      // 2. No explicit IDs: query strictly for records explicitly marked isTest: true
      recordsToDelete = await Reservation.find({ isTest: true });
    }

    if (recordsToDelete.length === 0) {
      return res.json({
        success: true,
        message: 'No test reservations found to delete. Genuine customer records are protected.',
        count: 0,
      });
    }

    const testIds = recordsToDelete.map((r) => r._id);

    // 1. Initial audit record created in PENDING state before starting the transaction and outside that transaction
    // If audit logging fails, execution halts and zero deletion is performed
    const auditRecord = await AuditLog.create({
      admin: adminEmail,
      operationType: 'DELETE_TEST_RESERVATIONS',
      targetRecordIds: testIds.map(String),
      deletedCount: 0,
      operationResult: 'PENDING',
      metadata: { requestedTargetIds: targetIds || [] },
    });

    // 2. Fail-closed check: MongoDB session & transaction support must be available
    if (typeof mongoose.startSession !== 'function') {
      const unsupportedErr = new Error('MongoDB deployment or driver does not support sessions/transactions');
      await AuditLog.findByIdAndUpdate(auditRecord._id, {
        operationResult: 'FAILED',
        metadata: { ...(auditRecord.metadata || {}), error: unsupportedErr.message },
      }).catch((e) => console.error('[AUDIT UPDATE ERROR]', e));
      throw unsupportedErr;
    }

    let session;
    try {
      session = await mongoose.startSession();
      if (!session || typeof session.startTransaction !== 'function') {
        throw new Error('Failed to acquire valid MongoDB transaction session');
      }
      session.startTransaction();
    } catch (sessionErr) {
      if (session && typeof session.endSession === 'function') {
        try { await session.endSession(); } catch (e) {}
      }
      await AuditLog.findByIdAndUpdate(auditRecord._id, {
        operationResult: 'FAILED',
        metadata: { ...(auditRecord.metadata || {}), error: `Session initialization failed: ${sessionErr.message}` },
      }).catch((e) => console.error('[AUDIT UPDATE ERROR]', e));
      throw sessionErr;
    }

    let actualDeletedCount = 0;
    let actualDeletedPayments = 0;
    let commitAttempted = false;

    try {
      // Step 1 inside transaction: Revalidate that all requested records exist using the active session (unconditional)
      const txRecords = await Reservation.find({ _id: { $in: testIds } }).session(session);

      if (txRecords.length !== testIds.length) {
        throw new Error(`Transaction pre-condition failed: expected ${testIds.length} reservations, found ${txRecords.length}.`);
      }

      // Step 2 inside transaction: Revalidate that every target has isTest === true
      const genuineRecord = txRecords.find((r) => r.isTest !== true);
      if (genuineRecord) {
        throw new Error(`Transaction aborted: reservation #${genuineRecord._id} is genuine and immune from deletion.`);
      }

      // Step 3 inside transaction: Delete associated payment records using the active session
      const paymentResult = await UpiPaymentLog.deleteMany({ matchedReservationId: { $in: testIds } }, { session });
      actualDeletedPayments = paymentResult.deletedCount || 0;

      // Step 4 inside transaction: Delete primary reservation records using the active session
      const resResult = await Reservation.deleteMany({ _id: { $in: testIds } }, { session });
      actualDeletedCount = resResult.deletedCount || 0;

      // Step 5 inside transaction: Verify the actual deletion counts
      if (actualDeletedCount !== testIds.length) {
        throw new Error(`Transaction aborted: expected ${testIds.length} reservation deletions, got ${actualDeletedCount}.`);
      }

      // Step 6: Commit transaction
      commitAttempted = true;
      await session.commitTransaction();
    } catch (txError) {
      const isUncertainCommit =
        commitAttempted &&
        (typeof txError.hasErrorLabel === 'function' && txError.hasErrorLabel('UnknownTransactionCommitResult'));

      if (isUncertainCommit) {
        // Do NOT mark FAILED: the commit may have succeeded on the replica set primary.
        // Leave audit in PENDING with uncertainCommit flag for authoritative admin reconciliation.
        await AuditLog.findByIdAndUpdate(auditRecord._id, {
          metadata: { ...(auditRecord.metadata || {}), error: txError.message, uncertainCommit: true },
        }).catch((e) => console.error('[AUDIT UPDATE ERROR]', e));
      } else {
        try { await session.abortTransaction(); } catch (abortErr) {}
        await AuditLog.findByIdAndUpdate(auditRecord._id, {
          operationResult: 'FAILED',
          metadata: { ...(auditRecord.metadata || {}), error: txError.message },
        }).catch((e) => console.error('[AUDIT UPDATE ERROR]', e));
      }
      throw txError;
    } finally {
      await session.endSession();
    }

    // 3. Handle audit-update failures after transaction commit:
    // If transaction commits successfully but updating the audit record to SUCCESS fails,
    // do not attempt destructive operation again, leave audit entry in PENDING, and return clean response.
    try {
      await AuditLog.findByIdAndUpdate(auditRecord._id, {
        deletedCount: actualDeletedCount,
        operationResult: 'SUCCESS',
        metadata: {
          ...(auditRecord.metadata || {}),
          deletedPayments: actualDeletedPayments,
        },
      });
    } catch (auditUpdateError) {
      console.error('[AUDIT UPDATE FAILED AFTER COMMIT] Transaction committed but audit finalization failed:', auditUpdateError);
      return res.status(200).json({
        success: true,
        message: `Deleted ${actualDeletedCount} test reservation(s) and ${actualDeletedPayments} payment log(s) via committed transaction. Notice: Audit log finalization encountered an error and remains PENDING for reconciliation.`,
        count: actualDeletedCount,
        auditId: auditRecord._id,
        auditStatus: 'PENDING_RECONCILIATION',
      });
    }

    console.log('[AUDIT - RESERVATIONS CLEANUP]', JSON.stringify({
      auditId: auditRecord._id,
      admin: adminEmail,
      timestamp,
      affectedIds: testIds,
      count: actualDeletedCount,
      status: 'SUCCESS',
    }));

    return res.json({
      success: true,
      message: `Deleted ${actualDeletedCount} test reservation(s). Genuine customer records remain untouched.`,
      count: actualDeletedCount,
      audit: {
        id: auditRecord._id,
        action: 'DELETE_TEST_RESERVATIONS',
        admin: adminEmail,
        timestamp,
        affectedIds: testIds,
        count: actualDeletedCount,
        status: 'SUCCESS',
      },
    });
  } catch (error) {
    console.error('[AUDIT - RESERVATIONS CLEANUP ERROR]', error);
    res.status(500).json({ success: false, message: 'Could not delete reservations', error: error.message });
  }
});

// ==================== 9. DELETE SINGLE RESERVATION (ADMIN) ====================
// DELETE /api/reservations/:id (requires auth)
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Reservation.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    console.log(`[ADMIN] Deleted reservation #${id}`);
    res.json({ success: true, message: 'Reservation deleted successfully', id });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ success: false, message: 'Could not delete reservation' });
  }
});

module.exports = router;
