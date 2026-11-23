const mongoose = require('mongoose');

const morasLiveEventSettingsSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      default: 'moras-live-2026',
      unique: true,
      trim: true,
      index: true,
    },
    eventName: {
      type: String,
      default: 'MORAS LIVE',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'YOUR MIC. YOUR MOMENT.',
      trim: true,
    },
    eventDate: {
      type: String,
      default: '', // Unconfirmed until admin sets it
      trim: true,
    },
    eventStartTime: {
      type: String,
      default: '',
      trim: true,
    },
    eventEndTime: {
      type: String,
      default: '',
      trim: true,
    },
    venue: {
      type: String,
      default: 'THE MORAS CAFE, Udayashree Sports Academy, Solapur Rd, Vijayapura, Karnataka 586103',
      trim: true,
    },
    maximumPasses: {
      type: Number,
      default: 60,
      min: [1, 'Capacity must be at least 1'],
    },
    proposedPassPrice: {
      type: Number,
      default: 149,
      min: 0,
    },
    approvedPassPrice: {
      type: Number,
      default: 149,
      min: 0,
    },
    priceConfirmed: {
      type: Boolean,
      default: false, // Must be explicitly confirmed by administrator
    },
    reservationsEnabled: {
      type: Boolean,
      default: true,
    },
    paymentCollectionEnabled: {
      type: Boolean,
      default: false, // Disabled until price and event details are approved
    },
    reservationExpiryHours: {
      type: Number,
      default: 24,
      min: 1,
    },
    cappuccinoIncluded: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

morasLiveEventSettingsSchema.statics.getSettings = async function (eventId = 'moras-live-2026') {
  let settings = await this.findOne({ eventId });
  if (!settings) {
    settings = await this.create({ eventId });
  }
  return settings;
};

const MorasLiveEventSettings = mongoose.model('MorasLiveEventSettings', morasLiveEventSettingsSchema);

module.exports = {
  MorasLiveEventSettings,
};
