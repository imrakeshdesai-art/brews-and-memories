const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { sendReservationEmail } = require('../utils/email');

// ==================== CREATE RESERVATION WITH ₹10 UPI PAYMENT ====================
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
      paymentStatus: 'paid',
      upiRef: (upiRef || '').trim(),
      status: 'confirmed',
      confirmationEmailSent: false,
      createdAt: new Date(),
    });

    // ── Dispatch Confirmation Email in Background ──────────────────────────────
    sendReservationEmail(newReservation)
      .then(async (emailRes) => {
        if (emailRes && emailRes.success) {
          await Reservation.findByIdAndUpdate(newReservation._id, { confirmationEmailSent: true });
          console.log(`[Reservation] Confirmation email successfully sent to ${newReservation.email}`);
        } else {
          console.warn(`[Reservation] Email dispatch result:`, emailRes?.errors || emailRes?.error);
        }
      })
      .catch((emailErr) => {
        console.error(`[Reservation] Error dispatching email:`, emailErr.message);
      });

    res.status(201).json(newReservation);

  } catch (error) {
    console.error('Reservation creation error:', error);
    res.status(500).json({ message: 'Could not submit reservation. Please try again.' });
  }
});

// ==================== GET ALL RESERVATIONS ====================
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

// ==================== UPDATE RESERVATION STATUS ====================
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
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Optionally re-send or send confirmation email if confirmed
    if (status === 'confirmed' && resendEmail) {
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

// ==================== RE-SEND CONFIRMATION EMAIL ====================
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
