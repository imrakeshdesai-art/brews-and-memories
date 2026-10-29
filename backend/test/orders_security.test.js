const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');

// Mock external notification dependencies to avoid sending real emails or WhatsApp during tests
const emailUtil = require('../src/utils/email');
const whatsappUtil = require('../src/utils/whatsapp');
emailUtil.sendOrderEmail = async () => ({ success: true });
whatsappUtil.sendOrderWhatsApp = async () => ({ success: true });

// In-memory mock database store for orders to protect real database records
const mockOrders = new Map();

const Order = require('../src/models/Order');

// Mock Order.create
Order.create = async (orderData) => {
  if (orderData.idempotencyKey && mockOrders.has(orderData.idempotencyKey)) {
    const err = new Error('E11000 duplicate key error collection: orders index: idempotencyKey_1 dup key');
    err.code = 11000;
    err.keyPattern = { idempotencyKey: 1 };
    throw err;
  }
  const orderDoc = {
    _id: `mock_order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...orderData,
    createdAt: new Date(),
  };
  if (orderData.idempotencyKey) {
    mockOrders.set(orderData.idempotencyKey, orderDoc);
  }
  mockOrders.set(orderDoc._id, orderDoc);
  return orderDoc;
};

// Mock Order.findOne
Order.findOne = async (query) => {
  if (query.idempotencyKey && mockOrders.has(query.idempotencyKey)) {
    return mockOrders.get(query.idempotencyKey);
  }
  if (query._id && mockOrders.has(query._id)) {
    return mockOrders.get(query._id);
  }
  return null;
};

// Mock Order.find
Order.find = () => ({
  sort: () => Array.from(mockOrders.values()).filter((v, idx, arr) => arr.findIndex(x => x._id === v._id) === idx),
});

// Mock Order.findByIdAndUpdate
Order.findByIdAndUpdate = async (id, update, options) => {
  const order = mockOrders.get(id);
  if (!order) return null;
  const updated = { ...order, ...update };
  mockOrders.set(id, updated);
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
  console.log('🚀 Starting Order Security & Idempotency Test Suite...\n');
  let passed = 0;
  let failed = 0;

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const tests = [
    {
      name: '1. Price Tampering Prevention — Reject order when client submits lower total',
      fn: async () => {
        // Tandoori Paneer Pizza M is ₹159, but client sends total: 10
        const res = await request('/api/orders', {
          method: 'POST',
          body: {
            name: 'Attacker Diner',
            phone: '9876543210',
            address: 'Table 1',
            items: [{ name: 'Tandoori Paneer Pizza', variant: 'M', qty: 1 }],
            total: 10, // Tampered price
          },
        });
        assert.strictEqual(res.status, 400);
        assert.match(res.data.message, /Price discrepancy detected/);
      },
    },
    {
      name: '2. Invalid Quantity Prevention — Reject 0, negative, and excessive quantities',
      fn: async () => {
        const resZero = await request('/api/orders', {
          method: 'POST',
          body: {
            name: 'Test Diner',
            phone: '9876543210',
            address: 'Table 1',
            items: [{ name: 'Cold Coffee', qty: 0 }],
          },
        });
        assert.strictEqual(resZero.status, 400);

        const resExcessive = await request('/api/orders', {
          method: 'POST',
          body: {
            name: 'Test Diner',
            phone: '9876543210',
            address: 'Table 1',
            items: [{ name: 'Cold Coffee', qty: 100 }],
          },
        });
        assert.strictEqual(resExcessive.status, 400);
        assert.match(resExcessive.data.message, /between 1 and 50/);
      },
    },
    {
      name: '3. Unknown Item Rejection — Reject items not on official menu',
      fn: async () => {
        const res = await request('/api/orders', {
          method: 'POST',
          body: {
            name: 'Test Diner',
            phone: '9876543210',
            address: 'Table 2',
            items: [{ name: 'Caviar Gold Burger', qty: 1 }],
          },
        });
        assert.strictEqual(res.status, 400);
        assert.match(res.data.message, /not available on the menu/);
      },
    },
    {
      name: '4. Multi-variant Size Enforcement — Require valid size (S/M/L) for pizzas',
      fn: async () => {
        const res = await request('/api/orders', {
          method: 'POST',
          body: {
            name: 'Test Diner',
            phone: '9876543210',
            address: 'Table 3',
            items: [{ name: 'Just Cheese Pizza', variant: 'XL', qty: 1 }],
          },
        });
        assert.strictEqual(res.status, 400);
        assert.match(res.data.message, /select a valid size/);
      },
    },
    {
      name: '5. Legitimate Order Processing — Calculate total authoritatively on backend',
      fn: async () => {
        // Tandoori Paneer Pizza M (₹159 x 2 = ₹318) + Cold Coffee (₹139 x 1 = ₹139) = ₹457
        const res = await request('/api/orders', {
          method: 'POST',
          body: {
            name: 'Priya Sharma',
            phone: '9876543210',
            address: 'Table 4',
            items: [
              { name: 'Tandoori Paneer Pizza', variant: 'M', qty: 2 },
              { name: 'Cold Coffee', qty: 1 },
            ],
            total: 457,
            idempotencyKey: 'test_order_key_001',
          },
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.total, 457);
        assert.strictEqual(res.data.status, 'pending');
        assert.strictEqual(res.data.items.length, 2);
      },
    },
    {
      name: '6. Duplicate Submission Protection — Return existing order with 200 and replay header',
      fn: async () => {
        const res = await request('/api/orders', {
          method: 'POST',
          body: {
            name: 'Priya Sharma',
            phone: '9876543210',
            address: 'Table 4',
            items: [
              { name: 'Tandoori Paneer Pizza', variant: 'M', qty: 2 },
              { name: 'Cold Coffee', qty: 1 },
            ],
            total: 457,
            idempotencyKey: 'test_order_key_001', // Identical key from test 5
          },
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.headers['x-idempotent-replay'], 'true');
        assert.strictEqual(res.data.total, 457);
      },
    },
    {
      name: '7. Concurrent Requests Safety — Simultaneous requests with same key yield 1 unique order',
      fn: async () => {
        const sharedKey = `concurrent_key_${Date.now()}`;
        const payload = {
          name: 'Concurrent Diner',
          phone: '9876543210',
          address: 'Table 5',
          items: [{ name: 'Cold Coffee', qty: 2 }],
          total: 278,
          idempotencyKey: sharedKey,
        };

        // Fire 5 concurrent requests simultaneously
        const promises = [1, 2, 3, 4, 5].map(() =>
          request('/api/orders', { method: 'POST', body: payload })
        );
        const results = await Promise.all(promises);

        // All 5 must succeed with 200 or 201
        for (const r of results) {
          assert([200, 201].includes(r.status), `Unexpected status: ${r.status}`);
          assert.strictEqual(r.data.total, 278);
        }

        // All 5 must reference the EXACT same order ID
        const firstId = results[0].data._id;
        for (const r of results) {
          assert.strictEqual(r.data._id, firstId);
        }
      },
    },
    {
      name: '8. Malformed Request Validation — Reject invalid phone and invalid table',
      fn: async () => {
        const badPhone = await request('/api/orders', {
          method: 'POST',
          body: {
            name: 'Test',
            phone: '123', // Not 10 digits
            address: 'Table 1',
            items: [{ name: 'Cold Coffee', qty: 1 }],
          },
        });
        assert.strictEqual(badPhone.status, 400);

        const badTable = await request('/api/orders', {
          method: 'POST',
          body: {
            name: 'Test',
            phone: '9876543210',
            address: 'Table 99', // Invalid table
            items: [{ name: 'Cold Coffee', qty: 1 }],
          },
        });
        assert.strictEqual(badTable.status, 400);
      },
    },
    {
      name: '9. Order Status Transitions & Admin/Kitchen Permissions',
      fn: async () => {
        // Create an order first
        const createRes = await request('/api/orders', {
          method: 'POST',
          body: {
            name: 'Status Test User',
            phone: '9876543210',
            address: 'Table 1',
            items: [{ name: 'Cold Coffee', qty: 1 }],
            total: 139,
            idempotencyKey: `status_key_${Date.now()}`,
          },
        });
        const orderId = createRes.data._id;

        // Unauthenticated PATCH must fail with 401
        const unauthPatch = await request(`/api/orders/${orderId}`, {
          method: 'PATCH',
          body: { status: 'preparing' },
        });
        assert.strictEqual(unauthPatch.status, 401);

        // Kitchen staff can update status: pending -> preparing
        const kitchenPatch = await request(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${kitchenToken}` },
          body: { status: 'preparing' },
        });
        assert.strictEqual(kitchenPatch.status, 200);
        assert.strictEqual(kitchenPatch.data.status, 'preparing');

        // Admin can update status: preparing -> completed
        const adminPatch = await request(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: { status: 'completed' },
        });
        assert.strictEqual(adminPatch.status, 200);
        assert.strictEqual(adminPatch.data.status, 'completed');

        // Invalid status transition rejected
        const badStatus = await request(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: { status: 'shipped_to_mars' },
        });
        assert.strictEqual(badStatus.status, 400);
      },
    },
    {
      name: '10. Strict CORS Enforcement — Only approved origins allowed, wildcard subdomains rejected',
      fn: async () => {
        // Approved production Vercel domain -> 200
        const resVercel = await request('/api/health', {
          headers: { Origin: 'https://themorascafe.vercel.app' },
        });
        assert.strictEqual(resVercel.status, 200);

        // Approved primary custom domain -> 200
        const resCustom = await request('/api/health', {
          headers: { Origin: 'https://themorascafe.in' },
        });
        assert.strictEqual(resCustom.status, 200);

        // Approved Cloudflare Pages preview domain -> 200
        const resCF = await request('/api/health', {
          headers: { Origin: 'https://brews-and-memories.pages.dev' },
        });
        assert.strictEqual(resCF.status, 200);

        // Arbitrary unapproved Vercel subdomain -> Rejected with 500 CORS error
        const resBadVercel = await request('/api/health', {
          headers: { Origin: 'https://malicious-random-site.vercel.app' },
        });
        assert.strictEqual(resBadVercel.status, 500);

        // Arbitrary unapproved Pages subdomain -> Rejected with 500 CORS error
        const resBadPages = await request('/api/health', {
          headers: { Origin: 'https://attacker.pages.dev' },
        });
        assert.strictEqual(resBadPages.status, 500);
      },
    },
  ];

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ✅ PASS: ${t.name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${t.name}`);
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
  console.error('Test runner encountered error:', err);
  if (server) server.close();
  process.exit(1);
});
