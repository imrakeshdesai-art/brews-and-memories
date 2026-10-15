const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const UpiPaymentLog = require('../models/UpiPaymentLog');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { sendReservationEmail } = require('../utils/email');

// ── UPI Notification Parser ──────────────────────────────────────────────────
function parseUpiNotification(text = '', title = '') {
  const fullText = `${title} ${text}`.trim();
  
  // 1. Extract amount (e.g. ₹10, Rs. 10, Rs 10.00, received 10)
  let amount = 10;
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
// Free Android webhook: forwards PhonePe notification in 1-2 seconds
router.post('/webhook/upi', async (req, res) => {
  try {
    const token = req.headers['x-webhook-token'] || req.query.token || req.body.token;
    const expectedToken = process.env.UPI_WEBHOOK_SECRET || 'moras_upi_secret_2026';

    if (token !== expectedToken) {
      console.warn('[UPI Webhook] Rejected unauthorized webhook call');
      return res.status(401).json({ message: 'Unauthorized webhook request' });
    }

    const { text, title, sender: explicitSender, utr: explicitUtr, amount: explicitAmount } = req.body;

    if (!text && !explicitUtr && !explicitAmount) {
      return res.status(400).json({ message: 'Missing notification payload' });
    }

    const parsed = parseUpiNotification(text || '', title || '');
    const amount = explicitAmount ? Number(explicitAmount) : parsed.amount;
    const utr = explicitUtr || parsed.utr;
    const sender = explicitSender || parsed.sender;

    console.log(`[UPI Webhook] 🔔 Incoming PhonePe Alert — Amount: ₹${amount}, UTR: ${utr || 'N/A'}, Sender: ${sender || 'N/A'}`);

    // Log the incoming payment
    const paymentLog = await UpiPaymentLog.create({
      rawTitle: title || '',
      rawText: text || JSON.stringify(req.body),
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

    // Strategy B: Match pending reservation created in the last 25 minutes
    if (!matchedReservation) {
      const windowStart = new Date(Date.now() - 25 * 60 * 1000);

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

    // If no reservation pending yet (diner sent money right before submit), keep paymentLog ready for instant match on submit!
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

// ==================== 2. POLL RESERVATION STATUS (FRONTEND AUTO-DETECT) ====================
// GET /api/reservations/status/:id
router.get('/status/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json({
      _id: reservation._id,
      status: reservation.status,
      paymentStatus: reservation.paymentStatus,
      confirmedAt: reservation.confirmedAt,
      confirmationEmailSent: reservation.confirmationEmailSent,
      name: reservation.name,
      email: reservation.email,
      phone: reservation.phone,
      date: reservation.date,
      time: reservation.time,
      guests: reservation.guests,
      amount: reservation.amount,
      upiRef: reservation.upiRef,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch status' });
  }
});

// ==================== 3. CREATE RESERVATION (STEP 1) ====================
// POST /api/reservations
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, guests, date, time, notes, upiRef, amount } = req.body;

    if (!name || !email || !phone || !date || !time) {
      return res.status(400).json({ message: 'Missing required fields (Name, Email, Phone, Date, Time)' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const cleanedPhone = String(phone).replace(/\D/g, '');
    const normalizedPhone = (cleanedPhone.length === 12 && cleanedPhone.startsWith('91'))
      ? cleanedPhone.slice(2)
      : cleanedPhone;

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Invalid 10-digit phone number' });
    }

    if (Number(guests) < 1) {
      return res.status(400).json({ message: 'Guests must be at least 1' });
    }

    const bookingAmount = Number(amount) || 10;
    const cleanUpiRef = (upiRef || '').trim();

    // Check if an unmatched payment arrived in the last 15 minutes!
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    let matchedLog = null;

    if (cleanUpiRef) {
      matchedLog = await UpiPaymentLog.findOne({
        utr: cleanUpiRef,
        matched: false,
        createdAt: { $gte: fifteenMinsAgo },
      });
    }

    if (!matchedLog) {
      matchedLog = await UpiPaymentLog.findOne({
        matched: false,
        amount: bookingAmount,
        createdAt: { $gte: fifteenMinsAgo },
      }).sort({ createdAt: -1 });
    }

    // If payment already arrived via PhonePe webhook, auto-confirm immediately!
    const isAlreadyPaid = !!matchedLog;

    const newReservation = await Reservation.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: normalizedPhone,
      guests: Number(guests),
      date,
      time,
      notes: (notes || '').trim(),
      amount: bookingAmount,
      paymentMethod: 'UPI',
      paymentStatus: isAlreadyPaid ? 'verified' : (cleanUpiRef ? 'pending_verification' : 'pending_payment'),
      upiRef: cleanUpiRef || (matchedLog ? matchedLog.utr : ''),
      status: isAlreadyPaid ? 'confirmed' : 'pending',
      confirmedAt: isAlreadyPaid ? new Date() : null,
      confirmationEmailSent: false,
      createdAt: new Date(),
    });

    if (matchedLog) {
      matchedLog.matchedReservationId = newReservation._id;
      matchedLog.matched = true;
      await matchedLog.save();

      // Dispatch confirmation email
      sendReservationEmail(newReservation)
        .then(async (emailRes) => {
          if (emailRes && emailRes.success) {
            await Reservation.findByIdAndUpdate(newReservation._id, { confirmationEmailSent: true });
            console.log(`[Reservation] Confirmation email sent to ${newReservation.email}`);
          }
        })
        .catch(console.error);
    }

    res.status(201).json(newReservation);

  } catch (error) {
    console.error('Reservation creation error:', error);
    res.status(500).json({ message: 'Could not submit reservation. Please try again.' });
  }
});

// ==================== 4. SUBMIT UTR FALLBACK (CUSTOMER ENTERED UTR OR CONFIRM BUTTON) ====================
// PATCH /api/reservations/:id/submit-utr
router.patch('/:id/submit-utr', async (req, res) => {
  try {
    const { id } = req.params;
    const { upiRef } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const cleanUpiRef = (upiRef || '').trim();
    let matchedLog = null;

    if (cleanUpiRef && cleanUpiRef.length >= 6) {
      // 1. Check if webhook already logged this exact UTR
      matchedLog = await UpiPaymentLog.findOne({
        utr: cleanUpiRef,
        matched: false,
      });
    }

    // 2. If no match yet, check recent unmatched logs for this amount (last 15 mins)
    if (!matchedLog) {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      matchedLog = await UpiPaymentLog.findOne({
        amount: reservation.amount || 10,
        matched: false,
        createdAt: { $gte: fifteenMinsAgo },
      }).sort({ createdAt: -1 });
    }

    const isVerified = !!matchedLog;

    reservation.upiRef = cleanUpiRef || (matchedLog ? matchedLog.utr : 'CONFIRMED_BY_USER');
    reservation.status = 'confirmed';
    reservation.paymentStatus = isVerified ? 'verified' : (cleanUpiRef ? 'paid' : 'pending_verification');
    reservation.confirmedAt = new Date();
    await reservation.save();

    if (matchedLog) {
      matchedLog.matchedReservationId = reservation._id;
      matchedLog.matched = true;
      await matchedLog.save();
    }

    // Dispatch email
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

module.exports = router;
