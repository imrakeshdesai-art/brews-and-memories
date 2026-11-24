const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    operationType: {
      type: String,
      required: true,
      enum: [
        'DELETE_TEST_ORDERS',
        'DELETE_TEST_RESERVATIONS',
        'DELETE_TEST_MORAS_LIVE_PASSES',
        'RECONCILE_AUDIT_LOG',
      ],
      index: true,
    },
    targetRecordIds: {
      type: [String],
      default: [],
    },
    deletedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    operationResult: {
      type: String,
      required: true,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'BLOCKED'],
      default: 'PENDING',
    },
    isReconciling: {
      type: Boolean,
      default: false,
    },
    reconcilingStartedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Enforce audit immutability: no client updates or deletions allowed
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
