const mongoose = require('mongoose');

const PARTICIPATION_ROLES = [
  'Singer',
  'Rapper',
  'Poet / Spoken Word Artist',
  'Comedian',
  'Dancer',
  'Beatboxer',
  'Musician / Instrumentalist',
  'Freestyle Artist',
  'Content Creator',
  'Other',
];

const REGISTRATION_STATUSES = [
  'New',
  'Reviewed',
  'Confirmed',
  'Rejected',
  'Cancelled',
];

const morasLiveRegistrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    participationRole: {
      type: String,
      required: true,
      enum: {
        values: PARTICIPATION_ROLES,
        message: '{VALUE} is not a valid participation role',
      },
    },
    otherRole: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Other role cannot exceed 100 characters'],
    },
    instagramUsername: {
      type: String,
      default: '',
      trim: true,
      maxlength: [60, 'Instagram username cannot exceed 60 characters'],
    },
    performanceDescription: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Performance description cannot exceed 1000 characters'],
    },
    registrationStatus: {
      type: String,
      enum: {
        values: REGISTRATION_STATUSES,
        message: '{VALUE} is not a valid registration status',
      },
      default: 'New',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
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

// Compound index for querying registrations by status and role quickly
morasLiveRegistrationSchema.index({ registrationStatus: 1, createdAt: -1 });
morasLiveRegistrationSchema.index({ participationRole: 1, createdAt: -1 });

module.exports = {
  MorasLiveRegistration: mongoose.model('MorasLiveRegistration', morasLiveRegistrationSchema),
  PARTICIPATION_ROLES,
  REGISTRATION_STATUSES,
};
