const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  guests: { type: Number, required: true, min: 1 },
  date: { type: String, required: true },
  time: { type: String, required: true },
  notes: { type: String, default: '', trim: true },
  amount: { type: Number, default: 10 },
  paymentMethod: { type: String, default: 'UPI' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'verified'],
    default: 'paid',
  },
  upiRef: { type: String, default: '', trim: true },
  confirmationEmailSent: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'confirmed',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Reservation', reservationSchema);
