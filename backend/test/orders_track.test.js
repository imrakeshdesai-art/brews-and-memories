const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Mock external notification dependencies to avoid sending real notifications during tests
const emailUtil = require('../src/utils/email');
const whatsappUtil = require('../src/utils/whatsapp');
emailUtil.sendOrderEmail = async () => ({ success: true });
whatsappUtil.sendOrderWhatsApp = async () => ({ success: true });

// In-memory mock database store for orders
const mockOrders = new Map();
const Order = require('../src/models/Order');

// Mock Order.create
Order.create = async (orderData) => {
  if (orderData.idempotencyKey && mockOrders.has(orderData.idempotencyKey)) {
    const err = new Error('E11000 duplicate key error');
    err.code = 11000;
    err.keyPattern = { idempotencyKey: 1 };
    throw err;
  }
  const idStr = new mongoose.Types.ObjectId().toString();
  const orderDoc = {
    _id: idStr,
    ...orderData,
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject() {
      // Exclude trackingTokenHash by default matching Mongoose select: false
      const { trackingTokenHash, ...rest } = this;
      return { ...rest };
    },
  };
  if (orderData.idempotencyKey) {
    mockOrders.set(orderData.idempotencyKey, orderDoc);
  }
  mockOrders.set(idStr, orderDoc);
  return orderDoc;
};

// Mock Order.findOne
Order.findOne = async (query) => {
  if (query.idempotencyKey && mockOrders.has(query.idempotencyKey)) {
    return mockOrders.get(query.idempotencyKey);
  }
  if (query._id) {
    const id = String(query._id);
    const order = mockOrders.get(id);
    if (!order) return null;

    // Check trackingTokenHash match if queried
    if (query.trackingTokenHash !== undefined) {
      if (order.trackingTokenHash !== query.trackingTokenHash) {
        return null;
      }
    }
    return order;
  }
  return null;
};

// Mock Order.find
Order.find = () => {
  const getSorted = () =>
    Array.from(mockOrders.values())
      .filter((v, idx, arr) => arr.findIndex(x => x._id === v._id) === idx)
      .map(doc => doc.toObject ? doc.toObject() : doc);

  return {
    select: (sel) => ({
      sort: () => getSorted(),
    }),
    sort: () => getSorted(),
  };
};

// Mock Order.findByIdAndUpdate
Order.findByIdAndUpdate = async (id, update, options) => {
  const idStr = String(id);
  const order = mockOrders.get(idStr);
  if (!order) return null;
  const updated = { ...order, ...update, updatedAt: new Date() };
  mockOrders.set(idStr, updated);
  if (updated.idempotencyKey) {
    mockOrders.set(updated.idempotencyKey, updated);
  }
  return updated;
};

const app = require('../src/app');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_min_32_characters_long_for_testing';
process.env.JWT_SECRET = JWT_SECRET;

const adminToken = jwt.sign({ id: 'admin1', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
const kitchenToken = jwt.sign({ id: 'kitchen1', role: 'kitchen' }, JWT_SECRET, { expiresIn: '1h' });

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }

  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    data: json,
  };
}

async function runTests() {
  console.log('🧪 Starting Live Customer Order Tracking Test Suite...\n');
  let passed = 0;
  let failed = 0;

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  let createdOrderId = null;
  let createdTrackingToken = null;

  const tests = [
    {
      name: '1. Token Generation & Entropy — Order creation generates 32-byte tracking token',
      fn: async () => {
        const res = await request('/api/orders', {
          method: 'POST',
          body: {
            name: 'Rohit Verma',
            phone: '9876543210',
            address: 'Table 2',
            items: [{ name: 'Classic Cold Coffee', qty: 1 }],
            total: 139,
          },
        });

        assert.strictEqual(res.status, 201);
        assert(res.data.trackingToken, 'Must return raw trackingToken to creator client');
        assert.strictEqual(typeof res.data.trackingToken, 'string');
        assert.strictEqual(res.data.trackingToken.length, 64, 'Must be 64 hex characters (32 bytes / 256 bits)');
        assert(res.data.trackingUrl.includes('#token='), 'Must format URL with hash fragment for log-safety');

        createdOrderId = res.data._id;
        createdTrackingToken = res.data.trackingToken;
      },
    },
    {
      name: '2. One-Way SHA-256 Storage — Database stores only the token hash, never the raw token',
      fn: async () => {
        const storedOrder = mockOrders.get(createdOrderId);
        assert(storedOrder, 'Order must exist in mock DB');
        assert(storedOrder.trackingTokenHash, 'Database must store trackingTokenHash');
        assert.strictEqual(storedOrder.trackingToken, undefined, 'Database must NEVER store raw trackingToken');

        const expectedHash = crypto.createHash('sha256').update(createdTrackingToken).digest('hex');
        assert.strictEqual(storedOrder.trackingTokenHash, expectedHash, 'Stored hash must match SHA-256 of token');
      },
    },
    {
      name: '3. Token Privacy / Scoping — Admin and KDS order listings never expose tracking token or hash',
      fn: async () => {
        const res = await request('/api/orders', {
          headers: { Authorization: `Bearer ${kitchenToken}` },
        });

        assert.strictEqual(res.status, 200);
        assert(Array.isArray(res.data));
        const orderInList = res.data.find((o) => o._id === createdOrderId);
        assert(orderInList, 'Order must be in KDS list');
        assert.strictEqual(orderInList.trackingToken, undefined, 'KDS list must not expose trackingToken');
        assert.strictEqual(orderInList.trackingTokenHash, undefined, 'KDS list must not expose trackingTokenHash');
      },
    },
    {
      name: '4. Tracking Header Authentication — Retrieve live status using X-Tracking-Token',
      fn: async () => {
        const res = await request(`/api/orders/track/${createdOrderId}`, {
          headers: { 'X-Tracking-Token': createdTrackingToken },
        });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.orderId, createdOrderId);
        assert.strictEqual(res.data.status, 'pending');
        assert.strictEqual(res.data.table, 'Table 2');
        assert(Array.isArray(res.data.items));
        assert.strictEqual(res.data.items.length, 1);
        assert.strictEqual(res.data.items[0].name, 'Classic Cold Coffee');
      },
    },
    {
      name: '5. Zero PII Exposure — Customer personal and payment details are strictly omitted',
      fn: async () => {
        const res = await request(`/api/orders/track/${createdOrderId}`, {
          headers: { 'X-Tracking-Token': createdTrackingToken },
        });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.name, undefined, 'Customer name must be omitted');
        assert.strictEqual(res.data.phone, undefined, 'Customer phone must be omitted');
        assert.strictEqual(res.data.email, undefined, 'Customer email must be omitted');
        assert.strictEqual(res.data.total, undefined, 'Order total must be omitted');
        assert.strictEqual(res.data.payment, undefined, 'Payment method must be omitted');
        assert.strictEqual(res.data.idempotencyKey, undefined, 'Idempotency key must be omitted');
        assert.strictEqual(res.data.trackingTokenHash, undefined, 'Token hash must be omitted');
      },
    },
    {
      name: '6. Invalid Token Rejection — Mismatched or fake token returns generic 404',
      fn: async () => {
        const fakeToken = crypto.randomBytes(32).toString('hex');
        const res = await request(`/api/orders/track/${createdOrderId}`, {
          headers: { 'X-Tracking-Token': fakeToken },
        });

        assert.strictEqual(res.status, 404);
        assert.strictEqual(res.data.message, 'Order not found');
      },
    },
    {
      name: '7. Missing Token Rejection — Request without token header returns 404',
      fn: async () => {
        const res = await request(`/api/orders/track/${createdOrderId}`);
        assert.strictEqual(res.status, 404);
        assert.strictEqual(res.data.message, 'Order not found');
      },
    },
    {
      name: '8. Malformed / Invalid ObjectId Handling — Non-hex or invalid ID returns 404 cleanly',
      fn: async () => {
        const res = await request('/api/orders/track/not-a-valid-id-12345', {
          headers: { 'X-Tracking-Token': createdTrackingToken },
        });

        assert.strictEqual(res.status, 404);
        assert.strictEqual(res.data.message, 'Order not found');
      },
    },
    {
      name: '9. Status Synchronization — KDS PATCH immediately reflects on live tracking response',
      fn: async () => {
        // Kitchen staff transitions order: pending -> preparing
        const patchRes1 = await request(`/api/orders/${createdOrderId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${kitchenToken}` },
          body: { status: 'preparing' },
        });
        assert.strictEqual(patchRes1.status, 200);

        // Tracking client polls again
        const trackRes1 = await request(`/api/orders/track/${createdOrderId}`, {
          headers: { 'X-Tracking-Token': createdTrackingToken },
        });
        assert.strictEqual(trackRes1.status, 200);
        assert.strictEqual(trackRes1.data.status, 'preparing');

        // Kitchen staff transitions order: preparing -> completed
        const patchRes2 = await request(`/api/orders/${createdOrderId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${kitchenToken}` },
          body: { status: 'completed' },
        });
        assert.strictEqual(patchRes2.status, 200);

        // Tracking client polls again
        const trackRes2 = await request(`/api/orders/track/${createdOrderId}`, {
          headers: { 'X-Tracking-Token': createdTrackingToken },
        });
        assert.strictEqual(trackRes2.status, 200);
        assert.strictEqual(trackRes2.data.status, 'completed');
      },
    },
    {
      name: '10. Legacy Order Compatibility — Orders created without token remain safe and return 404',
      fn: async () => {
        const legacyId = new mongoose.Types.ObjectId().toString();
        mockOrders.set(legacyId, {
          _id: legacyId,
          name: 'Legacy Diner',
          phone: '9876543210',
          address: 'Table 1',
          items: [{ name: 'Espresso', qty: 1 }],
          status: 'completed',
          // Note: NO trackingTokenHash
          createdAt: new Date(),
        });

        const res = await request(`/api/orders/track/${legacyId}`, {
          headers: { 'X-Tracking-Token': crypto.randomBytes(32).toString('hex') },
        });
        assert.strictEqual(res.status, 404);
        assert.strictEqual(res.data.message, 'Order not found');
      },
    },
    {
      name: '11. Rate Limiting Protection — Dedicated limiter prevents abusive high-frequency polling',
      fn: async () => {
        let got429 = false;
        // The trackLimiter is configured for 30 requests per minute
        // Fire 35 rapid requests to verify 429 throttling
        for (let i = 0; i < 35; i++) {
          const res = await request(`/api/orders/track/${createdOrderId}`, {
            headers: { 'X-Tracking-Token': createdTrackingToken },
          });
          if (res.status === 429) {
            got429 = true;
            break;
          }
        }
        assert(got429, 'Rate limiter must return HTTP 429 when threshold exceeded');
      },
    },
  ];

  for (const test of tests) {
    try {
      await test.fn();
      console.log(`  ✅ PASS: ${test.name}`);
      passed++;
    } catch (err) {
      console.log(`  ❌ FAIL: ${test.name}`);
      console.error('     Error:', err.message);
      failed++;
    }
  }

  server.close();
  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${tests.length} tests.`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
