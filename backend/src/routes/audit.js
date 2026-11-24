const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { reconcileAuditLog, getPendingAuditLogs } = require('../utils/auditReconciliation');

// =========================================================================
// 1. LIST STALE PENDING AUDIT RECORDS (ADMIN ONLY)
// GET /api/audit/pending
// =========================================================================
router.get('/pending', auth, checkRole(['admin']), async (req, res) => {
  try {
    const pendingLogs = await getPendingAuditLogs();
    res.json({
      success: true,
      count: pendingLogs.length,
      pendingLogs,
    });
  } catch (error) {
    console.error('[AUDIT ROUTE] Fetch pending audit logs error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch pending audit records' });
  }
});

// =========================================================================
// 2. RECONCILE STALE PENDING AUDIT RECORD (ADMIN ONLY)
// POST /api/audit/reconcile/:id
// Inspects authoritative database state and finalizes the audit record safely.
// =========================================================================
router.post('/reconcile/:id', auth, checkRole(['admin']), async (req, res) => {
  const adminEmail = req.user?.username || req.user?.email || 'admin';
  try {
    const result = await reconcileAuditLog(req.params.id, adminEmail);
    res.json(result);
  } catch (error) {
    console.error('[AUDIT ROUTE] Reconciliation error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Could not reconcile audit record',
    });
  }
});

module.exports = router;
