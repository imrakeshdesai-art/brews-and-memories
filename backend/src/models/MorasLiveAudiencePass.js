const mongoose = require('mongoose');

const morasLiveAudiencePassSchema = new mongoose.Schema(
  {
    passId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    eventId: {
      type: String,
      default: 'moras-live-2026',
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Customer name must be at least 2 characters'],
      maxlength: [100, 'Customer name cannot exceed 100 characters'],
    },
    normalizedMobileNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'],
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    qrToken: {
      type: String,
      required: true,
      trim: true,
    },
    qrTokenHash: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    reservationStatus: {
      type: String,
      enum: {
        values: ['RESERVED', 'CONFIRMED', 'EXPIRED', 'CANCELLED'],
        message: '{VALUE} is not a valid reservation status',
      },
      default: 'RESERVED',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'PAID', 'REFUNDED'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'PENDING',
      index: true,
    },
    ticketStatus: {
      type: String,
      enum: {
        values: ['INACTIVE', 'ACTIVE', 'REVOKED'],
        message: '{VALUE} is not a valid ticket status',
      },
      default: 'INACTIVE',
      index: true,
    },
    cappuccinoRedeemed: {
      type: Boolean,
      default: false,
      index: true,
    },
    cappuccinoRedeemedAt: {
      type: Date,
      default: null,
    },
    cappuccinoRedeemedBy: {
      type: String,
      default: '',
      trim: true,
    },
    entryCheckedIn: {
      type: Boolean,
      default: false,
      index: true,
    },
    entryCheckedInAt: {
      type: Date,
      default: null,
    },
    entryCheckedInBy: {
      type: String,
      default: '',
      trim: true,
    },
    payableAmount: {
      type: Number,
      default: 149,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      default: '',
      trim: true,
    },
    upiTransactionReference: {
      type: String,
      default: '',
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: One normalized mobile number can only have ONE pass registration per event!
morasLiveAudiencePassSchema.index(
  { eventId: 1, normalizedMobileNumber: 1 },
  { unique: true }
);

// Compound Index for fast inventory and status checks
morasLiveAudiencePassSchema.index({ eventId: 1, reservationStatus: 1, expiresAt: 1 });
morasLiveAudiencePassSchema.index({ eventId: 1, paymentStatus: 1 });

const MorasLiveAudiencePass = mongoose.model('MorasLiveAudiencePass', morasLiveAudiencePassSchema);

module.exports = {
  MorasLiveAudiencePass,
};
