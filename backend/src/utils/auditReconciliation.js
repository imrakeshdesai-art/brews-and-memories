const AuditLog = require('../models/AuditLog');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const UpiPaymentLog = require('../models/UpiPaymentLog');
const { MorasLiveAudiencePass } = require('../models/MorasLiveAudiencePass');
const { MorasLivePayment } = require('../models/MorasLivePayment');

/**
 * Returns all audit log entries currently awaiting reconciliation (PENDING status).
 * Excludes sensitive internals and projects only safe operational fields.
 */
async function getPendingAuditLogs() {
  const logs = await AuditLog.find({ operationResult: 'PENDING' })
    .select('_id admin operationType targetRecordIds deletedCount operationResult isReconciling timestamp metadata')
    .sort({ timestamp: -1 });

  return logs.map((log) => ({
    _id: log._id,
    admin: log.admin,
    operationType: log.operationType,
    targetCount: (log.targetRecordIds || []).length,
    targetRecordIds: log.targetRecordIds,
    deletedCount: log.deletedCount,
    operationResult: log.operationResult,
    isReconciling: Boolean(log.isReconciling),
    timestamp: log.timestamp,
    metadata: {
      requestedTargetIds: log.metadata?.requestedTargetIds || log.metadata?.requestedPassIds || [],
      error: log.metadata?.error || undefined,
      reconciliationInvestigation: log.metadata?.reconciliationInvestigation || undefined,
    },
  }));
}

/**
 * Authoritative, admin-only reconciliation procedure for PENDING audit logs.
 *
 * SAFETY INVARIANTS:
 * 1. NEVER repeats a deletion blindly (read-only verification).
 * 2. Concurrency Control: Uses atomic lock (`isReconciling`) to prevent simultaneous runs.
 * 3. Inspects both primary and associated payment collections.
 * 4. Only finalizes SUCCESS when ALL expected primary and associated records are confirmed absent.
 * 5. Only finalizes FAILED when ALL expected primary records remain and transaction rollback is verified.
 * 6. Mixed or unexpected states are left UNRESOLVED (PENDING) with an investigation flag.
 * 7. Records reconciliation as a separate, append-only RECONCILE_AUDIT_LOG entry.
 * 8. Sanitizes response output to never expose internal stacks or sensitive data.
 */
async function reconcileAuditLog(auditId, adminEmail = 'admin') {
  const cleanId = String(auditId).trim();

  // 1. Concurrency control: atomically lock the audit record if it is PENDING and not currently being reconciled
  const audit = await AuditLog.findOneAndUpdate(
    {
      _id: cleanId,
      operationResult: 'PENDING',
      isReconciling: { $ne: true },
    },
    {
      $set: {
        isReconciling: true,
        reconcilingStartedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!audit) {
    const existing = await AuditLog.findById(cleanId);
    if (!existing) {
      const err = new Error(`Audit record #${cleanId} not found`);
      err.status = 404;
      throw err;
    }
    if (existing.isReconciling === true) {
      const err = new Error(`Reconciliation is already in progress for audit record #${cleanId}`);
      err.status = 409;
      throw err;
    }
    return {
      success: true,
      alreadyFinalized: true,
      status: existing.operationResult,
      auditId: existing._id,
      operationType: existing.operationType,
      message: `Audit record #${cleanId} is already finalized with status: ${existing.operationResult}.`,
    };
  }

  try {
    const { operationType, targetRecordIds = [] } = audit;
    const cleanTargetIds = (targetRecordIds || []).map(String).filter(Boolean);
    const expectedCount = cleanTargetIds.length;
    const now = new Date().toISOString();

    const ALLOWED_OPERATIONS = [
      'DELETE_TEST_ORDERS',
      'DELETE_TEST_RESERVATIONS',
      'DELETE_TEST_MORAS_LIVE_PASSES',
    ];

    if (!ALLOWED_OPERATIONS.includes(operationType)) {
      const err = new Error(`Unsupported operationType '${operationType}' for reconciliation`);
      err.status = 400;
      throw err;
    }

    if (expectedCount === 0) {
      audit.operationResult = 'FAILED';
      audit.metadata = {
        ...(audit.metadata || {}),
        reconciliation: 'No target record IDs specified in pending audit record.',
        reconciledBy: adminEmail,
        reconciledAt: now,
      };
      await audit.save();

      await AuditLog.create({
        admin: adminEmail,
        operationType: 'RECONCILE_AUDIT_LOG',
        targetRecordIds: [String(audit._id)],
        deletedCount: 0,
        operationResult: 'SUCCESS',
        metadata: { reconciledAuditId: audit._id, targetOperation: operationType, outcome: 'FAILED' },
      }).catch((e) => console.error('[RECONCILIATION AUDIT LOG WRITE ERROR]', e));

      return {
        success: true,
        status: 'FAILED',
        count: 0,
        auditId: audit._id,
        operationType,
        message: 'Reconciled to FAILED (zero target IDs specified).',
      };
    }

    // =========================================================================
    // 1. ORDER DELETION RECONCILIATION
    // =========================================================================
    if (operationType === 'DELETE_TEST_ORDERS') {
      const remainingOrders = await Order.find({ _id: { $in: cleanTargetIds } });
      const remainingCount = remainingOrders.length;

      if (remainingCount === 0) {
        // All targets absent -> Transaction committed successfully!
        audit.operationResult = 'SUCCESS';
        audit.deletedCount = expectedCount;
        audit.metadata = {
          ...(audit.metadata || {}),
          reconciliation: `Reconciled: Confirmed 0 of ${expectedCount} target orders remain in database. Transaction was successfully committed.`,
          reconciledBy: adminEmail,
          reconciledAt: now,
        };
        await audit.save();

        await AuditLog.create({
          admin: adminEmail,
          operationType: 'RECONCILE_AUDIT_LOG',
          targetRecordIds: [String(audit._id)],
          deletedCount: expectedCount,
          operationResult: 'SUCCESS',
          metadata: { reconciledAuditId: audit._id, targetOperation: operationType, outcome: 'SUCCESS' },
        }).catch((e) => console.error('[RECONCILIATION AUDIT LOG WRITE ERROR]', e));

        return {
          success: true,
          status: 'SUCCESS',
          count: expectedCount,
          auditId: audit._id,
          operationType,
          message: `Reconciled: All ${expectedCount} target orders confirmed deleted.`,
        };
      } else if (remainingCount === expectedCount) {
        // All targets remain -> Transaction aborted / rolled back
        audit.operationResult = 'FAILED';
        audit.deletedCount = 0;
        audit.metadata = {
          ...(audit.metadata || {}),
          reconciliation: `Reconciled: All ${expectedCount} target orders still exist in database. Transaction was aborted or rolled back.`,
          reconciledBy: adminEmail,
          reconciledAt: now,
        };
        await audit.save();

        await AuditLog.create({
          admin: adminEmail,
          operationType: 'RECONCILE_AUDIT_LOG',
          targetRecordIds: [String(audit._id)],
          deletedCount: 0,
          operationResult: 'SUCCESS',
          metadata: { reconciledAuditId: audit._id, targetOperation: operationType, outcome: 'FAILED' },
        }).catch((e) => console.error('[RECONCILIATION AUDIT LOG WRITE ERROR]', e));

        return {
          success: true,
          status: 'FAILED',
          count: 0,
          auditId: audit._id,
          operationType,
          message: `Reconciled: All ${expectedCount} target orders remain in database. Transaction was aborted.`,
        };
      } else {
        // Mixed state: some records remain, others are absent -> DO NOT FINALIZE; LEAVE PENDING
        audit.metadata = {
          ...(audit.metadata || {}),
          reconciliationInvestigation: `INVESTIGATION_REQUIRED: Partial records detected. ${remainingCount} of ${expectedCount} orders remain.`,
          investigationLoggedAt: now,
          investigatedBy: adminEmail,
        };
        await audit.save();

        return {
          success: false,
          status: 'UNRESOLVED',
          requiresInvestigation: true,
          auditId: audit._id,
          operationType,
          remainingCount,
          expectedCount,
          message: `Investigation required: Partial orders remaining (${remainingCount} of ${expectedCount} exist). Audit record left unresolved.`,
        };
      }
    }

    // =========================================================================
    // 2. RESERVATION DELETION RECONCILIATION
    // =========================================================================
    if (operationType === 'DELETE_TEST_RESERVATIONS') {
      const remainingReservations = await Reservation.find({ _id: { $in: cleanTargetIds } });
      const remainingPayments = await UpiPaymentLog.find({ matchedReservationId: { $in: cleanTargetIds } });

      const resCount = remainingReservations.length;
      const paymentCount = remainingPayments.length;

      if (resCount === 0 && paymentCount === 0) {
        // Both primary reservations and associated payments absent -> Transaction committed!
        audit.operationResult = 'SUCCESS';
        audit.deletedCount = expectedCount;
        audit.metadata = {
          ...(audit.metadata || {}),
          reconciliation: `Reconciled: Confirmed all ${expectedCount} reservations and associated payment records are deleted. Transaction was committed.`,
          reconciledBy: adminEmail,
          reconciledAt: now,
        };
        await audit.save();

        await AuditLog.create({
          admin: adminEmail,
          operationType: 'RECONCILE_AUDIT_LOG',
          targetRecordIds: [String(audit._id)],
          deletedCount: expectedCount,
          operationResult: 'SUCCESS',
          metadata: { reconciledAuditId: audit._id, targetOperation: operationType, outcome: 'SUCCESS' },
        }).catch((e) => console.error('[RECONCILIATION AUDIT LOG WRITE ERROR]', e));

        return {
          success: true,
          status: 'SUCCESS',
          count: expectedCount,
          auditId: audit._id,
          operationType,
          message: `Reconciled: All ${expectedCount} reservations and associated payments confirmed deleted.`,
        };
      } else if (resCount === expectedCount) {
        // Primary reservations all remain -> Transaction aborted / rolled back
        // Check if payment logs were unexpectedly touched
        if (paymentCount > 0 || !audit.metadata?.deletedPayments) {
          audit.operationResult = 'FAILED';
          audit.deletedCount = 0;
          audit.metadata = {
            ...(audit.metadata || {}),
            reconciliation: `Reconciled: All ${expectedCount} reservations remain in database. Transaction was aborted or rolled back.`,
            reconciledBy: adminEmail,
            reconciledAt: now,
          };
          await audit.save();

          await AuditLog.create({
            admin: adminEmail,
            operationType: 'RECONCILE_AUDIT_LOG',
            targetRecordIds: [String(audit._id)],
            deletedCount: 0,
            operationResult: 'SUCCESS',
            metadata: { reconciledAuditId: audit._id, targetOperation: operationType, outcome: 'FAILED' },
          }).catch((e) => console.error('[RECONCILIATION AUDIT LOG WRITE ERROR]', e));

          return {
            success: true,
            status: 'FAILED',
            count: 0,
            auditId: audit._id,
            operationType,
            message: `Reconciled: All ${expectedCount} reservations remain in database. Transaction was aborted.`,
          };
        } else {
          // Reservations remain, but payment records were missing! Mixed state!
          audit.metadata = {
            ...(audit.metadata || {}),
            reconciliationInvestigation: `INVESTIGATION_REQUIRED: Mixed state. Reservations remain (${resCount}/${expectedCount}), but associated payments are absent.`,
            investigationLoggedAt: now,
            investigatedBy: adminEmail,
          };
          await audit.save();

          return {
            success: false,
            status: 'UNRESOLVED',
            requiresInvestigation: true,
            auditId: audit._id,
            operationType,
            message: 'Investigation required: Only one collection retained records (reservations present, payments absent). Audit record left unresolved.',
          };
        }
      } else {
        // Mixed state: e.g. reservations were deleted (resCount === 0) but paymentCount > 0, OR partial reservations remain
        audit.metadata = {
          ...(audit.metadata || {}),
          reconciliationInvestigation: `INVESTIGATION_REQUIRED: Mixed state detected. Remaining reservations: ${resCount}/${expectedCount}, remaining payments: ${paymentCount}.`,
          investigationLoggedAt: now,
          investigatedBy: adminEmail,
        };
        await audit.save();

        return {
          success: false,
          status: 'UNRESOLVED',
          requiresInvestigation: true,
          auditId: audit._id,
          operationType,
          message: `Investigation required: Mixed state detected (${resCount} reservations, ${paymentCount} payments remain). Audit record left unresolved.`,
        };
      }
    }

    // =========================================================================
    // 3. MORAS LIVE PASS DELETION RECONCILIATION
    // =========================================================================
    if (operationType === 'DELETE_TEST_MORAS_LIVE_PASSES') {
      const remainingPasses = await MorasLiveAudiencePass.find({
        eventId: 'moras-live-2026',
        passId: { $in: cleanTargetIds },
      });
      const remainingPayments = await MorasLivePayment.find({
        passId: { $in: cleanTargetIds },
      });

      const passCount = remainingPasses.length;
      const paymentCount = remainingPayments.length;

      if (passCount === 0 && paymentCount === 0) {
        // Both primary passes and associated payments absent -> Transaction committed!
        audit.operationResult = 'SUCCESS';
        audit.deletedCount = expectedCount;
        audit.metadata = {
          ...(audit.metadata || {}),
          reconciliation: `Reconciled: Confirmed all ${expectedCount} passes and associated payment records are deleted. Transaction was committed.`,
          reconciledBy: adminEmail,
          reconciledAt: now,
        };
        await audit.save();

        await AuditLog.create({
          admin: adminEmail,
          operationType: 'RECONCILE_AUDIT_LOG',
          targetRecordIds: [String(audit._id)],
          deletedCount: expectedCount,
          operationResult: 'SUCCESS',
          metadata: { reconciledAuditId: audit._id, targetOperation: operationType, outcome: 'SUCCESS' },
        }).catch((e) => console.error('[RECONCILIATION AUDIT LOG WRITE ERROR]', e));

        return {
          success: true,
          status: 'SUCCESS',
          count: expectedCount,
          auditId: audit._id,
          operationType,
          message: `Reconciled: All ${expectedCount} passes and associated payments confirmed deleted.`,
        };
      } else if (passCount === expectedCount) {
        // All passes remain -> Transaction aborted / rolled back
        if (paymentCount > 0 || !audit.metadata?.deletedPayments) {
          audit.operationResult = 'FAILED';
          audit.deletedCount = 0;
          audit.metadata = {
            ...(audit.metadata || {}),
            reconciliation: `Reconciled: All ${expectedCount} passes still exist in database. Transaction was aborted or rolled back.`,
            reconciledBy: adminEmail,
            reconciledAt: now,
          };
          await audit.save();

          await AuditLog.create({
            admin: adminEmail,
            operationType: 'RECONCILE_AUDIT_LOG',
            targetRecordIds: [String(audit._id)],
            deletedCount: 0,
            operationResult: 'SUCCESS',
            metadata: { reconciledAuditId: audit._id, targetOperation: operationType, outcome: 'FAILED' },
          }).catch((e) => console.error('[RECONCILIATION AUDIT LOG WRITE ERROR]', e));

          return {
            success: true,
            status: 'FAILED',
            count: 0,
            auditId: audit._id,
            operationType,
            message: `Reconciled: All ${expectedCount} passes remain in database. Transaction was aborted.`,
          };
        } else {
          // Passes remain but payments were deleted! Mixed state!
          audit.metadata = {
            ...(audit.metadata || {}),
            reconciliationInvestigation: `INVESTIGATION_REQUIRED: Mixed state. Passes remain (${passCount}/${expectedCount}), but associated payments are absent.`,
            investigationLoggedAt: now,
            investigatedBy: adminEmail,
          };
          await audit.save();

          return {
            success: false,
            status: 'UNRESOLVED',
            requiresInvestigation: true,
            auditId: audit._id,
            operationType,
            message: 'Investigation required: Only one collection retained records (passes present, payments absent). Audit record left unresolved.',
          };
        }
      } else {
        // Mixed state
        audit.metadata = {
          ...(audit.metadata || {}),
          reconciliationInvestigation: `INVESTIGATION_REQUIRED: Mixed state detected. Remaining passes: ${passCount}/${expectedCount}, remaining payments: ${paymentCount}.`,
          investigationLoggedAt: now,
          investigatedBy: adminEmail,
        };
        await audit.save();

        return {
          success: false,
          status: 'UNRESOLVED',
          requiresInvestigation: true,
          auditId: audit._id,
          operationType,
          message: `Investigation required: Mixed state detected (${passCount} passes, ${paymentCount} payments remain). Audit record left unresolved.`,
        };
      }
    }
  } finally {
    // Release the reconciliation lock unconditionally
    await AuditLog.findByIdAndUpdate(cleanId, {
      $set: { isReconciling: false },
    }).catch(() => {});
  }
}

module.exports = {
  reconcileAuditLog,
  getPendingAuditLogs,
};
