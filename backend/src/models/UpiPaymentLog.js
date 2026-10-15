const mongoose = require('mongoose');

const upiPaymentLogSchema = new mongoose.Schema({
  rawTitle: { type: String, default: '' },
  rawText: { type: String, required: true },
  amount: { type: Number, default: 10 },
  utr: { type: String, default: '' },
  sender: { type: String, default: '' },
  matchedReservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', default: null },
  matched: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UpiPaymentLog', upiPaymentLogSchema);
