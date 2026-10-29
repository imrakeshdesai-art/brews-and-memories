const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Mock external notification utilities
const emailUtil = require('../src/utils/email');
const whatsappUtil = require('../src/utils/whatsapp');
emailUtil.sendOrderEmail = async () => ({ success: true });
whatsappUtil.sendOrderWhatsApp = async () => ({ success: true });

// Mock MenuAvailability in-memory store
const mockAvailability = new Map();
const MenuAvailability = require('../src/models/MenuAvailability');
MenuAvailability._isMocked = true;

MenuAvailability.find = (filter = {}) => {
  const allDocs = Array.from(mockAvailability.values());
  let filtered = allDocs;
  if (filter.isAvailable !== undefined) {
    filtered = allDocs.filter((d) => d.isAvailable === filter.isAvailable);
  }
  return {
    lean: () => Promise.resolve(filtered.map((d) => ({ ...d }))),
    select: () => ({
      lean: () => Promise.resolve(filtered.map((d) => ({ ...d }))),
    }),
  };
};

MenuAvailability.findOneAndUpdate = async (filter, update, options) => {
  const key = filter.itemKey;
  const existing = mockAvailability.get(key) || {
    itemKey: key,
    name: update.name || key,
    isAvailable: true,
  };

  const updated = {
    ...existing,
    ...update,
    itemKey: key,
    name: update.name || existing.name,
    updatedAt: update.updatedAt || new Date(),
  };

  mockAvailability.set(key, updated);
  return updated;
};

// Mock Order in-memory store
const mockOrders = new Map();
const Order = require('../src/models/Order');

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

Order.findOne = async (query) => {
  if (query.idempotencyKey && mockOrders.has(query.idempotencyKey)) {
    return mockOrders.get(query.idempotencyKey);
  }
  if (query._id) {
    return mockOrders.get(String(query._id)) || null;
  }
  return null;
};

const app = require('../src/app');

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_min_32_characters_long_for_testing';
process.env.JWT_SECRET = JWT_SECRET;

const adminToken = jwt.sign({ id: 'admin1', role: 'admin', email: 'admin@morascafe.in' }, JWT_SECRET, { expiresIn: '1h' });
const kitchenToken = jwt.sign({ id: 'kitchen1', role: 'kitchen', email: 'kitchen@morascafe.in' }, JWT_SECRET, { expiresIn: '1h' });

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
    headers: res.headers,
    body: json,
  };
}

async function runTests() {
  console.log('\n🧪 Starting Menu Item Availability & Sold-Out Test Suite...\n');

  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  try {
    // 1. Initial State: Public availability should be empty
    const initRes = await request('/api/menu/availability');
    assert.strictEqual(initRes.status, 200);
    assert.deepStrictEqual(initRes.body.unavailableKeys, []);
    console.log('  ✅ PASS: 1. Initial State — Default availability has 0 sold out items');

    // 2. Security: Unauthenticated toggle rejection
    const unauthRes = await request('/api/menu/admin/availability/cappuccino', {
      method: 'PATCH',
      body: { isAvailable: false },
    });
    assert.strictEqual(unauthRes.status, 401);
    console.log('  ✅ PASS: 2. Auth Protection — Unauthenticated request rejected (401)');

    // 3. Security: Kitchen staff cannot modify availability
    const kitchenRes = await request('/api/menu/admin/availability/cappuccino', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${kitchenToken}` },
      body: { isAvailable: false },
    });
    assert.strictEqual(kitchenRes.status, 403);
    console.log('  ✅ PASS: 3. Role Protection — Kitchen role denied modifying availability (403)');

    // 4. Validation: Invalid item key returns 400
    const invalidKeyRes = await request('/api/menu/admin/availability/non-existent-dish-xyz', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isAvailable: false },
    });
    assert.strictEqual(invalidKeyRes.status, 400);
    console.log('  ✅ PASS: 4. Key Validation — Non-existent catalog key rejected (400)');

    // 5. Admin marks item as Sold Out
    const markSoldOutRes = await request('/api/menu/admin/availability/cappuccino', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isAvailable: false },
    });
    assert.strictEqual(markSoldOutRes.status, 200);
    assert.strictEqual(markSoldOutRes.body.item.itemKey, 'cappuccino');
    assert.strictEqual(markSoldOutRes.body.item.isAvailable, false);
    console.log('  ✅ PASS: 5. Admin Control — Administrator successfully marked "Cappuccino" as Sold Out');

    // 6. Public availability reflects sold-out item
    const publicAvailRes = await request('/api/menu/availability');
    assert.strictEqual(publicAvailRes.status, 200);
    assert.strictEqual(publicAvailRes.body.unavailableKeys.includes('cappuccino'), true);
    assert.strictEqual(publicAvailRes.body.unavailableItems.includes('Cappuccino'), true);
    console.log('  ✅ PASS: 6. Public Availability — Customer endpoint accurately lists "cappuccino" as unavailable');

    // 7. Order rejection for sold out item
    const soldOutOrderRes = await request('/api/orders', {
      method: 'POST',
      body: {
        name: 'John Doe',
        phone: '9876543210',
        address: 'Table 1',
      phone: '9876543210',
        items: [{ name: 'Cappuccino', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(soldOutOrderRes.status, 400);
    assert.strictEqual(soldOutOrderRes.body.code, 'ITEM_UNAVAILABLE');
    assert.strictEqual(soldOutOrderRes.body.unavailableItems.includes('Cappuccino'), true);
    console.log('  ✅ PASS: 7. Backend Enforcement — Order with sold-out item rejected with ITEM_UNAVAILABLE (400)');

    // 8. Mixed Cart rejection: available item + sold-out item
    const mixedOrderRes = await request('/api/orders', {
      method: 'POST',
      body: {
        name: 'Jane Smith',
        phone: '9876543210',
        address: 'Table 2',
        items: [
          { name: 'Masala Tea', qty: 1 },
          { name: 'Cappuccino', qty: 1 },
        ],
        payment: 'counter',
      },
    });
    assert.strictEqual(mixedOrderRes.status, 400);
    assert.strictEqual(mixedOrderRes.body.code, 'ITEM_UNAVAILABLE');
    assert.strictEqual(mixedOrderRes.body.unavailableItems.includes('Cappuccino'), true);
    console.log('  ✅ PASS: 8. Mixed Cart Enforcement — Order containing both available and sold-out items rejected');

    // 9. Pre-existing order with idempotency replay remains functional
    const legacyKey = 'legacy_replay_key_777';
    mockOrders.set(legacyKey, {
      _id: 'legacy_order_123',
      idempotencyKey: legacyKey,
      name: 'Legacy User',
      phone: '9876543210',
      email: '',
      address: 'Table 1',
      payment: 'counter',
      items: [{ name: 'Cappuccino', variant: '', qty: 1, price: 109, lineTotal: 109 }],
      total: 109,
      status: 'pending',
    });

    const replayRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': legacyKey },
      body: {
        name: 'Legacy User',
        phone: '9876543210',
        address: 'Table 1',
        items: [{ name: 'Cappuccino', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(replayRes.status, 200);
    assert.strictEqual(replayRes.headers.get('x-idempotent-replay'), 'true');
    console.log('  ✅ PASS: 9. Idempotency Preservation — Pre-existing order replays 200 even if item is now sold-out');

    // 10. Admin restores item to Available
    const restoreRes = await request('/api/menu/admin/availability/cappuccino', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isAvailable: true },
    });
    assert.strictEqual(restoreRes.status, 200);
    assert.strictEqual(restoreRes.body.item.isAvailable, true);
    console.log('  ✅ PASS: 10. Item Restoration — Administrator restored "Cappuccino" to Available');

    // 11. Ordering restored item succeeds
    const successOrderRes = await request('/api/orders', {
      method: 'POST',
      body: {
        name: 'Happy Customer',
        phone: '9876543210',
        address: 'Table 3',
        items: [{ name: 'Cappuccino', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(successOrderRes.status, 201);
    assert.strictEqual(successOrderRes.body.items[0].name, 'Cappuccino');
    console.log('  ✅ PASS: 11. Restored Ordering — Order successfully created once item is restored (201)');

    // 12. Public availability endpoint now shows 0 unavailable items
    const restoredPublicRes = await request('/api/menu/availability');
    assert.strictEqual(restoredPublicRes.status, 200);
    assert.strictEqual(restoredPublicRes.body.unavailableKeys.includes('cappuccino'), false);
    console.log('  ✅ PASS: 12. Full Circle — Public availability reflects 0 sold-out items');

        // 13. Idempotency: Same key, different item but same total and item count returns 409
    const teaBoostKey = 'idem_key_tea_boost_999';
    // First, place an order for Masala Tea (₹30, qty 1, total ₹30)
    const teaRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': teaBoostKey },
      body: {
        name: 'Tea Lover',
        phone: '9876543210',
        address: 'Table 1',
        items: [{ name: 'Masala Tea', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(teaRes.status, 201);
    assert.strictEqual(teaRes.body.total, 30);

    // Replay with exact same key, identical payload -> HTTP 200 Replay
    const teaReplayRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': teaBoostKey },
      body: {
        name: 'Tea Lover',
        phone: '9876543210',
        address: 'Table 1',
        items: [{ name: 'Masala Tea', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(teaReplayRes.status, 200);
    assert.strictEqual(teaReplayRes.headers.get('x-idempotent-replay'), 'true');
    assert.strictEqual(teaReplayRes.body._id, teaRes.body._id);

    // Reuse key with Boost (also ₹30, qty 1, total ₹30) -> Same total and item count, different item name -> HTTP 409
    const boostConflictRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': teaBoostKey },
      body: {
        name: 'Tea Lover',
        phone: '9876543210',
        address: 'Table 1',
        items: [{ name: 'Boost', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(boostConflictRes.status, 409);
    assert.match(boostConflictRes.body.message, /different order details/);
    console.log('  ✅ PASS: 13. Idempotency Protection — Same key, different item with same total/count returns 409');

    // 14. Idempotency: Same key, different variant or quantity returns 409
    const pizzaKey = 'idem_key_pizza_variant_888';
    // Create order with Pizza size M
    const pizzaRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': pizzaKey },
      body: {
        name: 'Pizza Lover',
        phone: '9876543210',
        address: 'Table 2',
        items: [{ name: 'Tandoori Paneer Pizza', variant: 'M', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(pizzaRes.status, 201);

    // Reusing same key with Pizza size L -> Variant mismatch -> HTTP 409
    const pizzaVariantConflictRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': pizzaKey },
      body: {
        name: 'Pizza Lover',
        phone: '9876543210',
        address: 'Table 2',
        items: [{ name: 'Tandoori Paneer Pizza', variant: 'L', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(pizzaVariantConflictRes.status, 409);
    assert.match(pizzaVariantConflictRes.body.message, /different order details/);

    // Quantity mismatch test with distinct key
    const qtyKey = 'idem_key_qty_777';
    const coffeeRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': qtyKey },
      body: {
        name: 'Coffee Lover',
        phone: '9876543210',
        address: 'Table 2',
        items: [{ name: 'Cold Coffee', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(coffeeRes.status, 201);

    // Reusing same key with qty 2 -> HTTP 409
    const coffeeQtyConflictRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': qtyKey },
      body: {
        name: 'Coffee Lover',
        phone: '9876543210',
        address: 'Table 2',
        items: [{ name: 'Cold Coffee', qty: 2 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(coffeeQtyConflictRes.status, 409);
    assert.match(coffeeQtyConflictRes.body.message, /different order details/);
    console.log('  ✅ PASS: 14. Idempotency Protection — Same key, different variant or quantity returns 409');

    // 15. Idempotency: Same key, different table or customer details returns 409
    // 15a. Different table
    const tableConflictRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': teaBoostKey },
      body: {
        name: 'Tea Lover',
        phone: '9876543210',
        address: 'Table 5', // Original was Table 1
        items: [{ name: 'Masala Tea', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(tableConflictRes.status, 409);
    assert.match(tableConflictRes.body.message, /different order details/);

    // 15b. Different phone
    const phoneConflictRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': teaBoostKey },
      body: {
        name: 'Tea Lover',
        phone: '9123456789', // Original was 9876543210
        address: 'Table 1',
        items: [{ name: 'Masala Tea', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(phoneConflictRes.status, 409);
    assert.match(phoneConflictRes.body.message, /different order details/);

    // 15c. Different customer name
    const nameConflictRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': teaBoostKey },
      body: {
        name: 'Another Customer', // Original was Tea Lover
        phone: '9876543210',
        address: 'Table 1',
        items: [{ name: 'Masala Tea', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(nameConflictRes.status, 409);
    assert.match(nameConflictRes.body.message, /different order details/);
    console.log('  ✅ PASS: 15. Idempotency Protection — Same key, different table/customer details returns 409');

    // 16. New order containing a Sold Out item is rejected
    // Admin marks "Blue Lagoon" as Sold Out
    const markLagoonRes = await request('/api/menu/admin/availability/blue%20lagoon', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isAvailable: false },
    });
    assert.strictEqual(markLagoonRes.status, 200);

    // New order requesting Blue Lagoon -> HTTP 400 ITEM_UNAVAILABLE
    const newSoldOutOrderRes = await request('/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': 'fresh_order_key_lagoon_666' },
      body: {
        name: 'Thirsty Diner',
        phone: '9876543210',
        address: 'Table 3',
        items: [{ name: 'Blue Lagoon', qty: 1 }],
        payment: 'counter',
      },
    });
    assert.strictEqual(newSoldOutOrderRes.status, 400);
    assert.strictEqual(newSoldOutOrderRes.body.code, 'ITEM_UNAVAILABLE');
    assert.strictEqual(newSoldOutOrderRes.body.unavailableItems.includes('Blue Lagoon'), true);

    // Restore Blue Lagoon
    await request('/api/menu/admin/availability/blue%20lagoon', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isAvailable: true },
    });
    console.log('  ✅ PASS: 16. Sold-Out Guard — New order containing Sold Out item rejected (400 ITEM_UNAVAILABLE)');

    console.log('\n🎉 All 16 Menu Availability & Comprehensive Idempotency tests passed with flying colors!\n');
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
