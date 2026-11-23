const mongoose = require('mongoose');

const morasLivePaymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    passId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['UPI', 'CASH'],
        message: '{VALUE} is not a valid payment method',
      },
      required: true,
    },
    upiTransactionReference: {
      type: String,
      default: '',
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['PAID', 'REFUNDED'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'PAID',
      index: true,
    },
    verifiedBy: {
      type: String,
      required: true,
      trim: true,
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

morasLivePaymentSchema.index({ passId: 1, createdAt: -1 });

const MorasLivePayment = mongoose.model('MorasLivePayment', morasLivePaymentSchema);

module.exports = {
  MorasLivePayment,
};
