const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const {
  MorasLiveRegistration,
  PARTICIPATION_ROLES,
  REGISTRATION_STATUSES,
} = require('../models/MorasLiveRegistration');
const { generateUniqueRegistrationId } = require('../utils/generateRegistrationId');

// Dedicated rate limiter for MORAS LIVE registration submissions
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 registrations per IP
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts from this connection. Please try again after 15 minutes.',
  },
});

// Helper: Normalize Indian 10-digit mobile number
function normalizeIndianMobile(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  return null;
}

// Helper: Escape CSV fields securely
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// ==================== 1. PUBLIC REGISTRATION SUBMISSION ====================
// POST /api/moras-live/register
router.post('/register', registrationLimiter, async (req, res) => {
  try {
    const {
      fullName,
      mobileNumber,
      email,
      participationRole,
      otherRole,
      instagramUsername,
      performanceDescription,
    } = req.body || {};

    // 1. Full Name Validation
    const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        field: 'fullName',
        message: 'Please provide a valid full name between 2 and 100 characters.',
      });
    }

    // 2. Mobile Number Validation (Indian 10-digit)
    const normalizedMobile = normalizeIndianMobile(mobileNumber);
    if (!normalizedMobile) {
      return res.status(400).json({
        success: false,
        field: 'mobileNumber',
        message: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).',
      });
    }

    // 3. Email Validation
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail) || cleanEmail.length > 150) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Please enter a valid email address.',
      });
    }

    // 4. Participation Role Validation
    const cleanRole = typeof participationRole === 'string' ? participationRole.trim() : '';
    if (!cleanRole || !PARTICIPATION_ROLES.includes(cleanRole)) {
      return res.status(400).json({
        success: false,
        field: 'participationRole',
        message: `Please select a valid role from the list.`,
      });
    }

    // 5. If Other, otherRole is required
    let cleanOtherRole = '';
    if (cleanRole === 'Other') {
      cleanOtherRole = typeof otherRole === 'string' ? otherRole.trim() : '';
      if (!cleanOtherRole || cleanOtherRole.length < 2 || cleanOtherRole.length > 100) {
        return res.status(400).json({
          success: false,
          field: 'otherRole',
          message: 'Please specify your participation category (2 to 100 characters).',
        });
      }
    }

    // 6. Optional Instagram Handle
    let cleanInstagram = '';
    if (typeof instagramUsername === 'string') {
      cleanInstagram = instagramUsername.trim().replace(/^@+/, '');
      if (cleanInstagram.length > 60) {
        cleanInstagram = cleanInstagram.slice(0, 60);
      }
    }

    // 7. Optional Performance Description
    let cleanDesc = '';
    if (typeof performanceDescription === 'string') {
      cleanDesc = performanceDescription.trim();
      if (cleanDesc.length > 1000) {
        cleanDesc = cleanDesc.slice(0, 1000);
      }
    }

    // 8. Duplicate Detection Strategy (Mobile Number or Email)
    const existing = await MorasLiveRegistration.findOne({
      $or: [{ mobileNumber: normalizedMobile }, { email: cleanEmail }],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        duplicate: true,
        message: `You are already registered for MORAS LIVE with Registration ID: ${existing.registrationId}. Our curation team will contact you once line-ups and entry details are finalized!`,
        registrationId: existing.registrationId,
        existingRegistration: {
          registrationId: existing.registrationId,
          fullName: existing.fullName,
          participationRole: existing.participationRole,
          createdAt: existing.createdAt,
        },
      });
    }

    // 9. Generate Unique Registration ID
    const registrationId = await generateUniqueRegistrationId();

    // 10. Persist to MongoDB
    const registration = await MorasLiveRegistration.create({
      registrationId,
      fullName: cleanName,
      mobileNumber: normalizedMobile,
      email: cleanEmail,
      participationRole: cleanRole,
      otherRole: cleanOtherRole,
      instagramUsername: cleanInstagram,
      performanceDescription: cleanDesc,
      registrationStatus: 'New',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    });

    return res.status(201).json({
      success: true,
      message: "YOU'RE ON THE LIST!",
      subheading: "Thank you for registering for MORAS LIVE. We've received your details and look forward to having you with us.",
      registrationId: registration.registrationId,
      registration: {
        registrationId: registration.registrationId,
        fullName: registration.fullName,
        email: registration.email,
        mobileNumber: registration.mobileNumber,
        participationRole: registration.participationRole,
        otherRole: registration.otherRole,
        instagramUsername: registration.instagramUsername,
        registrationStatus: registration.registrationStatus,
        createdAt: registration.createdAt,
      },
    });
  } catch (error) {
    console.error('[MORAS LIVE] Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to process your registration right now. Please check your network and try again.',
    });
  }
});

// ==================== 2. ADMIN: GET ALL REGISTRATIONS ====================
// GET /api/moras-live/registrations
router.get('/registrations', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { search, role, status, limit = 200, skip = 0 } = req.query;

    const filter = {};

    if (status && status !== 'All') {
      filter.registrationStatus = status;
    }

    if (role && role !== 'All') {
      filter.participationRole = role;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { fullName: regex },
        { mobileNumber: regex },
        { email: regex },
        { registrationId: regex },
        { instagramUsername: regex },
        { otherRole: regex },
      ];
    }

    const total = await MorasLiveRegistration.countDocuments(filter);
    const registrations = await MorasLiveRegistration.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip, 10) || 0)
      .limit(parseInt(limit, 10) || 200);

    return res.json({
      success: true,
      total,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error('[MORAS LIVE] Fetch registrations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve registrations' });
  }
});

// ==================== 3. ADMIN: GET REGISTRATION STATS ====================
// GET /api/moras-live/stats
router.get('/stats', auth, checkRole(['admin']), async (req, res) => {
  try {
    const total = await MorasLiveRegistration.countDocuments({});
    const performers = await MorasLiveRegistration.countDocuments({
      participationRole: { $ne: 'Audience / Attendee' },
    });
    const audience = await MorasLiveRegistration.countDocuments({
      participationRole: 'Audience / Attendee',
    });
    const pendingReviews = await MorasLiveRegistration.countDocuments({
      registrationStatus: 'New',
    });
    const confirmed = await MorasLiveRegistration.countDocuments({
      registrationStatus: 'Confirmed',
    });

    // Breakdown by Role
    const roleAggregation = await MorasLiveRegistration.aggregate([
      { $group: { _id: '$participationRole', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Breakdown by Status
    const statusAggregation = await MorasLiveRegistration.aggregate([
      { $group: { _id: '$registrationStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.json({
      success: true,
      stats: {
        total,
        performers,
        audience,
        pendingReviews,
        confirmed,
        byRole: roleAggregation.map((item) => ({ role: item._id, count: item.count })),
        byStatus: statusAggregation.map((item) => ({ status: item._id, count: item.count })),
      },
    });
  } catch (error) {
    console.error('[MORAS LIVE] Stats aggregation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute registration stats' });
  }
});

// ==================== 4. ADMIN: UPDATE REGISTRATION STATUS ====================
// PATCH /api/moras-live/registrations/:id/status
router.patch('/registrations/:id/status', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!REGISTRATION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${REGISTRATION_STATUSES.join(', ')}`,
      });
    }

    const updateFields = {
      registrationStatus: status,
    };
    if (typeof adminNotes === 'string') {
      updateFields.adminNotes = adminNotes.trim();
    }

    const updated = await MorasLiveRegistration.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    return res.json({
      success: true,
      message: `Registration status updated to ${status}`,
      registration: updated,
    });
  } catch (error) {
    console.error('[MORAS LIVE] Status update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update registration status' });
  }
});

// ==================== 5. ADMIN: DELETE REGISTRATION ====================
// DELETE /api/moras-live/registrations/:id
router.delete('/registrations/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await MorasLiveRegistration.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    return res.json({
      success: true,
      message: `Registration ${deleted.registrationId} (${deleted.fullName}) deleted successfully`,
    });
  } catch (error) {
    console.error('[MORAS LIVE] Delete registration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete registration' });
  }
});

// ==================== 6. ADMIN: EXPORT REGISTRATIONS AS CSV ====================
// GET /api/moras-live/export
router.get('/export', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.registrationStatus = status;
    }
    if (role && role !== 'All') {
      filter.participationRole = role;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { fullName: regex },
        { mobileNumber: regex },
        { email: regex },
        { registrationId: regex },
        { instagramUsername: regex },
      ];
    }

    const list = await MorasLiveRegistration.find(filter).sort({ createdAt: -1 });

    const headers = [
      'Registration ID',
      'Full Name',
      'Mobile Number',
      'Email',
      'Role',
      'Other Role Details',
      'Instagram',
      'Performance Description',
      'Status',
      'Admin Notes',
      'Registered At (UTC)',
    ];

    const rows = list.map((reg) => [
      escapeCsvValue(reg.registrationId),
      escapeCsvValue(reg.fullName),
      escapeCsvValue(reg.mobileNumber),
      escapeCsvValue(reg.email),
      escapeCsvValue(reg.participationRole),
      escapeCsvValue(reg.otherRole || ''),
      escapeCsvValue(reg.instagramUsername ? `@${reg.instagramUsername}` : ''),
      escapeCsvValue(reg.performanceDescription || ''),
      escapeCsvValue(reg.registrationStatus),
      escapeCsvValue(reg.adminNotes || ''),
      escapeCsvValue(new Date(reg.createdAt).toISOString()),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="moras_live_registrations_${timestamp}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('[MORAS LIVE] CSV export error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate CSV export' });
  }
});

module.exports = router;
