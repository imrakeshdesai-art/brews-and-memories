/**
 * Role & Permission Middleware for MORAS LIVE Operations
 *
 * Explicit staff permissions:
 *  - moras_live_payment_collect: Record ₹149 Cash/UPI payment at entrance desk
 *  - moras_live_entry_checkin: Validate pass & check-in guest at door
 *  - moras_live_cappuccino_redeem: Redeem complimentary beverage at cafe bar
 *  - moras_live_pass_manage: Administrative pass search, status toggles & reporting
 *  - moras_live_event_settings: Manage event date, cutoff, capacity, pricing
 *
 * Administrator ('admin') retains full access across all operations.
 */

const ROLE_PERMISSIONS = {
  admin: [
    'moras_live_payment_collect',
    'moras_live_entry_checkin',
    'moras_live_cappuccino_redeem',
    'moras_live_pass_manage',
    'moras_live_event_settings',
  ],
  staff: [
    'moras_live_payment_collect',
    'moras_live_entry_checkin',
    'moras_live_cappuccino_redeem',
  ],
  kitchen: [
    'moras_live_payment_collect',
    'moras_live_entry_checkin',
    'moras_live_cappuccino_redeem',
  ],
  door: [
    'moras_live_payment_collect',
    'moras_live_entry_checkin',
  ],
  barista: [
    'moras_live_cappuccino_redeem',
  ],
};

function checkPermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin has superuser access to all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check user-level explicit permissions if present on user token
    if (Array.isArray(req.user.permissions) && req.user.permissions.includes(requiredPermission)) {
      return next();
    }

    // Check role-based permission map
    const rolePerms = ROLE_PERMISSIONS[req.user.role] || [];
    if (rolePerms.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({
      message: `Access denied: Missing required permission '${requiredPermission}'`,
    });
  };
}

module.exports = {
  checkPermission,
  ROLE_PERMISSIONS,
};
