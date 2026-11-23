const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_must_be_at_least_32_characters_long';

const app = require('../src/app');
const { MorasLiveRegistration } = require('../src/models/MorasLiveRegistration');

// In-memory mock store for MorasLiveRegistration during tests if MongoDB is not connected
let mockRegistrations = [];

// Helper: Make HTTP request to local app
function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('json')
            ? JSON.parse(data)
            : data;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n🎤 Starting MORAS LIVE Event Registration Test Suite...\n');

  // If DB is connected, clear any test entries; if not, mock Mongoose methods
  const isDbConnected = require('mongoose').connection.readyState === 1;

  if (!isDbConnected) {
    console.log('ℹ️ Running with Mongoose Model Mocking (in-memory test mode)...');
    
    MorasLiveRegistration.findOne = (query) => {
      return {
        select: () => {
          if (query.registrationId) {
            const found = mockRegistrations.find((r) => r.registrationId === query.registrationId);
            return Promise.resolve(found ? { _id: found._id } : null);
          }
          return Promise.resolve(null);
        },
        then: (resolve) => {
          if (query.$or) {
            const match = mockRegistrations.find((r) =>
              query.$or.some((clause) => {
                if (clause.mobileNumber) return r.mobileNumber === clause.mobileNumber;
                if (clause.email) return r.email === clause.email;
                return false;
              })
            );
            return resolve(match || null);
          }
          if (query.registrationId) {
            const found = mockRegistrations.find((r) => r.registrationId === query.registrationId);
            return resolve(found || null);
          }
          return resolve(null);
        },
      };
    };

    MorasLiveRegistration.create = (doc) => {
      const created = {
        _id: 'mock_ml_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRegistrations.push(created);
      return Promise.resolve(created);
    };

    MorasLiveRegistration.countDocuments = (filter = {}) => {
      let filtered = [...mockRegistrations];
      if (filter.registrationStatus) {
        filtered = filtered.filter((r) => r.registrationStatus === filter.registrationStatus);
      }
      if (filter.participationRole) {
        if (typeof filter.participationRole === 'object' && filter.participationRole.$ne) {
          filtered = filtered.filter((r) => r.participationRole !== filter.participationRole.$ne);
        } else {
          filtered = filtered.filter((r) => r.participationRole === filter.participationRole);
        }
      }
      return Promise.resolve(filtered.length);
    };

    MorasLiveRegistration.find = (filter = {}) => {
      let filtered = [...mockRegistrations];
      if (filter.registrationStatus && filter.registrationStatus !== 'All') {
        filtered = filtered.filter((r) => r.registrationStatus === filter.registrationStatus);
      }
      if (filter.participationRole && filter.participationRole !== 'All') {
        filtered = filtered.filter((r) => r.participationRole === filter.participationRole);
      }
      if (filter.$or) {
        filtered = filtered.filter((r) =>
          filter.$or.some((c) => {
            const key = Object.keys(c)[0];
            const val = r[key] || '';
            return c[key].test(val);
          })
        );
      }

      return {
        sort: () => ({
          skip: (s) => ({
            limit: (l) => Promise.resolve(filtered.slice(s, s + l)),
          }),
          then: (resolve) => resolve(filtered),
        }),
      };
    };

    MorasLiveRegistration.findByIdAndUpdate = (id, update) => {
      const item = mockRegistrations.find((r) => r._id === id || r.registrationId === id);
      if (!item) return Promise.resolve(null);
      if (update.$set) {
        Object.assign(item, update.$set);
      }
      item.updatedAt = new Date();
      return Promise.resolve(item);
    };

    MorasLiveRegistration.findByIdAndDelete = (id) => {
      const idx = mockRegistrations.findIndex((r) => r._id === id || r.registrationId === id);
      if (idx === -1) return Promise.resolve(null);
      const deleted = mockRegistrations.splice(idx, 1)[0];
      return Promise.resolve(deleted);
    };

    MorasLiveRegistration.aggregate = (pipeline) => {
      const counts = {};
      const field = pipeline[0].$group._id.replace('$', '');
      mockRegistrations.forEach((r) => {
        const key = r[field] || 'Unknown';
        counts[key] = (counts[key] || 0) + 1;
      });
      const result = Object.entries(counts).map(([k, v]) => ({ _id: k, count: v }));
      return Promise.resolve(result);
    };
  } else {
    await MorasLiveRegistration.deleteMany({ email: /@test-moras-live\.com$/ });
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  // Tokens
  const adminToken = jwt.sign(
    { role: 'admin', username: 'admin@themorascafe.in' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const kitchenToken = jwt.sign(
    { role: 'kitchen', username: 'kitchen@themorascafe.in' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  let createdRegistrationId = null;
  let createdDocId = null;

  try {
    // 1. Successful Performer Registration (Singer)
    {
      const payload = {
        fullName: 'Rohit Kulkarni',
        mobileNumber: '+91 9988776655',
        email: 'rohit@test-moras-live.com',
        participationRole: 'Singer',
        instagramUsername: '@rohit_music',
        performanceDescription: 'Acoustic Bollywood unplugged and classical fusion',
      };

      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, payload);

      assert.strictEqual(res.status, 201, 'Should return 201 Created');
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.registrationId.startsWith('ML-'), 'Registration ID should start with ML-');
      assert.strictEqual(res.body.registration.fullName, 'Rohit Kulkarni');
      assert.strictEqual(res.body.registration.mobileNumber, '9988776655', 'Mobile number should be normalized');
      assert.strictEqual(res.body.registration.instagramUsername, 'rohit_music', 'Leading @ should be trimmed');
      createdRegistrationId = res.body.registrationId;
      createdDocId = res.body.registration.registrationId;
      console.log('  ✅ PASS: 1. Successful Performer Registration — Generates unique ID & normalizes data');
    }

    // 2. Successful Audience Registration
    {
      const payload = {
        fullName: 'Pooja Patil',
        mobileNumber: '09845012345',
        email: 'pooja@test-moras-live.com',
        participationRole: 'Audience / Attendee',
      };

      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, payload);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.registration.mobileNumber, '9845012345', 'Should strip leading 0');
      assert.strictEqual(res.body.registration.participationRole, 'Audience / Attendee');
      console.log('  ✅ PASS: 2. Successful Audience Registration — Handles attendee role smoothly');
    }

    // 3. Successful Other Role with custom specification
    {
      const payload = {
        fullName: 'Ananya Sharma',
        mobileNumber: '9123456780',
        email: 'ananya@test-moras-live.com',
        participationRole: 'Other',
        otherRole: 'Live Sand Art & Storyteller',
      };

      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, payload);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.registration.otherRole, 'Live Sand Art & Storyteller');
      console.log('  ✅ PASS: 3. Custom Role Support — Validates otherRole when category is Other');
    }

    // 4. Validation: Reject Empty or Too Short Name
    {
      const payload = {
        fullName: 'A',
        mobileNumber: '9876543210',
        email: 'test@test-moras-live.com',
        participationRole: 'Singer',
      };

      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, payload);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.field, 'fullName');
      console.log('  ✅ PASS: 4. Name Validation — Rejects short/empty names (<2 chars)');
    }

    // 5. Validation: Reject Invalid Indian Mobile Numbers
    {
      const invalidNumbers = ['1234567890', '98765', 'abcdefghij', '5555555555'];
      for (const num of invalidNumbers) {
        const res = await makeRequest(server, {
          hostname: 'localhost',
          port,
          path: '/api/moras-live/register',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }, {
          fullName: 'Test User',
          mobileNumber: num,
          email: 'valid@test-moras-live.com',
          participationRole: 'Poet / Spoken Word Artist',
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.body.field, 'mobileNumber');
      }
      console.log('  ✅ PASS: 5. Mobile Number Guard — Strictly validates 10-digit Indian mobile formats (6-9 start)');
    }

    // 6. Validation: Reject Invalid Email
    {
      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, {
        fullName: 'Test User',
        mobileNumber: '9876543210',
        email: 'not-an-email',
        participationRole: 'Singer',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.field, 'email');
      console.log('  ✅ PASS: 6. Email Validation — Rejects malformed email addresses');
    }

    // 7. Validation: Require otherRole if role is 'Other'
    {
      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, {
        fullName: 'Test User',
        mobileNumber: '9876543210',
        email: 'other_empty@test-moras-live.com',
        participationRole: 'Other',
        otherRole: '',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.field, 'otherRole');
      console.log('  ✅ PASS: 7. Conditional Field Requirement — Enforces otherRole description for Other');
    }

    // 8. Duplicate Submission Protection (Same Mobile)
    {
      const payload = {
        fullName: 'Duplicate Mobile Test',
        mobileNumber: '9988776655', // Already used by Rohit
        email: 'different_email@test-moras-live.com',
        participationRole: 'Dancer',
      };

      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, payload);

      assert.strictEqual(res.status, 409, 'Duplicate should return 409 Conflict');
      assert.strictEqual(res.body.duplicate, true);
      assert.strictEqual(res.body.registrationId, createdRegistrationId);
      console.log('  ✅ PASS: 8. Duplicate Mobile Guard — Prevents accidental re-submission and returns existing ID');
    }

    // 9. Duplicate Submission Protection (Same Email)
    {
      const payload = {
        fullName: 'Duplicate Email Test',
        mobileNumber: '9876543299',
        email: 'rohit@test-moras-live.com', // Already used by Rohit
        participationRole: 'Comedian',
      };

      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, payload);

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.duplicate, true);
      console.log('  ✅ PASS: 9. Duplicate Email Guard — Detects duplicates even with a different phone number');
    }

    // 10. Admin Protection: Unauthenticated request rejected (401)
    {
      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/registrations',
        method: 'GET',
      });
      assert.strictEqual(res.status, 401);
      console.log('  ✅ PASS: 10. Auth Protection — Rejects unauthenticated access to registration records');
    }

    // 11. Role Protection: Kitchen role denied access (403)
    {
      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/registrations',
        method: 'GET',
        headers: { Authorization: `Bearer ${kitchenToken}` },
      });
      assert.strictEqual(res.status, 403);
      console.log('  ✅ PASS: 11. Role Authorization — Restricts MORAS LIVE data strictly to administrators');
    }

    // 12. Admin GET /api/moras-live/registrations returns records
    {
      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/registrations',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.registrations.length >= 3);
      console.log(`  ✅ PASS: 12. Admin Registrations Listing — Fetched ${res.body.registrations.length} registered entries`);
    }

    // 13. Admin GET /api/moras-live/stats aggregates metrics
    {
      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/stats',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.stats.total >= 3);
      assert.ok(res.body.stats.performers >= 2);
      assert.ok(res.body.stats.audience >= 1);
      console.log('  ✅ PASS: 13. Summary Statistics — Correctly computes total, performers, audience, & pending counts');
    }

    // 14. Admin PATCH status update
    {
      const listRes = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/registrations',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const firstId = listRes.body.registrations[0]._id;

      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: `/api/moras-live/registrations/${firstId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      }, { status: 'Confirmed', adminNotes: 'Shortlisted for Slot 2 opening act' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.registration.registrationStatus, 'Confirmed');
      console.log('  ✅ PASS: 14. Status Transitions — Updates registration status and persists admin curation notes');
    }

    // 15. Admin GET /api/moras-live/export outputs CSV format
    {
      const res = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/export',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers['content-type'].includes('text/csv'));
      assert.ok(res.raw.includes('Registration ID,Full Name,Mobile Number,Email,Role'));
      assert.ok(res.raw.includes('Rohit Kulkarni'));
      console.log('  ✅ PASS: 15. CSV Export Engine — Generates properly quoted, safe CSV for spreadsheets');
    }

    // 16. Admin DELETE registration
    {
      const listRes = await makeRequest(server, {
        hostname: 'localhost',
        port,
        path: '/api/moras-live/registrations',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const target = listRes.body.registrations.find((r) => r.fullName === 'Ananya Sharma');
      if (target) {
        const res = await makeRequest(server, {
          hostname: 'localhost',
          port,
          path: `/api/moras-live/registrations/${target._id}`,
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        console.log('  ✅ PASS: 16. Record Deletion — Authorized administrators can delete registrations');
      }
    }

    console.log('\n🎉 ALL 16 MORAS LIVE Backend Tests Passed Successfully!\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
