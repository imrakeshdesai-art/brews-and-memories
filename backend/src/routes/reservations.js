const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const auth = require('../middleware/auth');

// ==================== CREATE RESERVATION ====================
// POST /api/reservations
router.post('/', async (req, res) => {
  try {
    const { name, phone, guests, date, time, notes } = req.body;

    if (!name || !phone || !date || !time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const cleanedPhone = String(phone).replace(/\D/g, '');
    const normalizedPhone = (cleanedPhone.length === 12 && cleanedPhone.startsWith('91'))
      ? cleanedPhone.slice(2)
      : cleanedPhone;

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    if (Number(guests) < 1) {
      return res.status(400).json({ message: 'Guests must be at least 1' });
    }

    const newReservation = await Reservation.create({
      name: name.trim(),
      phone: normalizedPhone,
      guests: Number(guests),
      date,
      time,
      notes: (notes || '').trim(),
      status: 'pending',
      createdAt: new Date(),
    });

    res.status(201).json(newReservation);

  } catch (error) {
    console.error('Reservation creation error:', error);
    res.status(500).json({ message: 'Could not submit reservation' });
  }
});

// ==================== GET ALL RESERVATIONS ====================
// GET /api/reservations (requires auth)
router.get('/', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ date: -1, time: -1, createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    console.error('Fetch reservations error:', error);
    res.status(500).json({ message: 'Could not fetch reservations' });
  }
});

// ==================== UPDATE RESERVATION STATUS ====================
// PATCH /api/reservations/:id (requires auth)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

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

    res.json(updated);

  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ message: 'Could not update reservation' });
  }
});

module.exports = router;
