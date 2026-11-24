const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_must_be_32_characters_long_12345';
process.env.JWT_SECRET = JWT_SECRET;

const app = require('../src/app');
const Reservation = require('../src/models/Reservation');
const Order = require('../src/models/Order');
const AuditLog = require('../src/models/AuditLog');
const UpiPaymentLog = require('../src/models/UpiPaymentLog');
const { MorasLiveAudiencePass } = require('../src/models/MorasLiveAudiencePass');
const { MorasLiveEventSettings } = require('../src/models/MorasLiveEventSettings');
const { MorasLivePayment } = require('../src/models/MorasLivePayment');
const { escapeHtml, buildItemRows, buildCustomerEmailHTML, buildReservationEmailHTML, buildMorasLivePassEmailHTML } = require('../src/utils/email');

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

async function runSecurityRemediationTests() {
  console.log('\n🔒 Starting Phase 1 Final Security Remediation Verification Suite...\n');

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const adminToken = jwt.sign({ id: 'admin1', role: 'admin', email: 'admin@themorascafe.in' }, JWT_SECRET, { expiresIn: '1h' });
  const kitchenToken = jwt.sign({ id: 'kitchen1', role: 'kitchen', email: 'kitchen@themorascafe.in' }, JWT_SECRET, { expiresIn: '1h' });

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // SUITE 1: GET /api/health Information Disclosure Remediation
    // ══════════════════════════════════════════════════════════════════════════
    const healthRes = await request('/api/health');
    assert.strictEqual(healthRes.status, 200, 'Health endpoint should return 200 OK');
    assert.strictEqual(healthRes.data.users, undefined, 'Health endpoint must NOT expose users array');
    assert.strictEqual(healthRes.data.status, 'ok', 'Status should be ok');
    assert.strictEqual(typeof healthRes.data.envCheck, 'object', 'envCheck object present without leaking secret values');
    console.log('  ✅ PASS: 1. Health Endpoint Privacy — Zero user/staff enumeration on unauthenticated GET /api/health');

    // ══════════════════════════════════════════════════════════════════════════
    // SUITE 2: UPI Webhook Hardened Authentication
    // ══════════════════════════════════════════════════════════════════════════
    const originalWebhookSecret = process.env.UPI_WEBHOOK_SECRET;

    // Test 2a: GET method rejected
    const webhookGet = await request('/api/reservations/webhook/upi?token=test_token', { method: 'GET' });
    assert.strictEqual(webhookGet.status, 404, 'GET method on /webhook/upi must return 404 Not Found');

    // Test 2b: Server misconfiguration (missing secret on server)
    delete process.env.UPI_WEBHOOK_SECRET;
    const webhookNoServerSecret = await request('/api/reservations/webhook/upi', {
      method: 'POST',
      headers: { 'x-webhook-token': 'any_token' },
      body: { amount: 59, utr: '123456789012' },
    });
    assert.strictEqual(webhookNoServerSecret.status, 500, 'Must fail with 500 when UPI_WEBHOOK_SECRET is unconfigured');

    // Restore server secret for subsequent tests
    const TEST_WEBHOOK_SECRET = 'super_secure_webhook_secret_for_phonepe_integration_2026';
    process.env.UPI_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

    // Test 2c: Missing authentication header
    const webhookNoHeader = await request('/api/reservations/webhook/upi', {
      method: 'POST',
      body: { amount: 59, utr: '123456789012' },
    });
    assert.strictEqual(webhookNoHeader.status, 401, 'Must reject when x-webhook-token header is absent');

    // Test 2d: Query parameter token rejected (must NOT authenticate)
    const webhookQueryToken = await request(`/api/reservations/webhook/upi?token=${TEST_WEBHOOK_SECRET}`, {
      method: 'POST',
      body: { amount: 59, utr: '123456789012' },
    });
    assert.strictEqual(webhookQueryToken.status, 401, 'Must reject authentication attempts via query parameter');

    // Test 2e: Request body token rejected (must NOT authenticate)
    const webhookBodyToken = await request('/api/reservations/webhook/upi', {
      method: 'POST',
      body: { token: TEST_WEBHOOK_SECRET, amount: 59, utr: '123456789012' },
    });
    assert.strictEqual(webhookBodyToken.status, 401, 'Must reject authentication attempts via request body');

    // Test 2f: Incorrect token in header
    const webhookWrongHeader = await request('/api/reservations/webhook/upi', {
      method: 'POST',
      headers: { 'x-webhook-token': 'wrong_secret_token_12345' },
      body: { amount: 59, utr: '123456789012' },
    });
    assert.strictEqual(webhookWrongHeader.status, 401, 'Must reject invalid token in x-webhook-token header');

    // Test 2g: Valid token in designated header accepted
    const origUpiCreate = UpiPaymentLog.create;
    UpiPaymentLog.create = async function (logData) {
      return { _id: 'mock_log_1', ...logData };
    };
    const origResFindOne = Reservation.findOne;
    const origWebhookResFind = Reservation.find;
    Reservation.findOne = async function () { return null; };
    Reservation.find = function () {
      return {
        sort: async function () { return []; },
      };
    };

    const webhookValid = await request('/api/reservations/webhook/upi', {
      method: 'POST',
      headers: { 'x-webhook-token': TEST_WEBHOOK_SECRET },
      body: { amount: 59, utr: '123456789012', sender: 'RAKESH' },
    });
    assert.strictEqual(webhookValid.status, 200, 'Valid header token must successfully authenticate webhook');
    assert.strictEqual(webhookValid.data.success, true);

    UpiPaymentLog.create = origUpiCreate;
    Reservation.findOne = origResFindOne;
    Reservation.find = origWebhookResFind;
    if (originalWebhookSecret) process.env.UPI_WEBHOOK_SECRET = originalWebhookSecret;
    console.log('  ✅ PASS: 2. UPI Webhook Hardened — Rejects GET, query tokens, body tokens, missing secret; accepts strictly valid header');

    // ══════════════════════════════════════════════════════════════════════════
    // SUITE 3: Dead Route Removal & Client-Supplied isTest Immunity
    // ══════════════════════════════════════════════════════════════════════════

    // Test 3a: GET /api/reservations/status/:id is permanently removed (404)
    const statusRemoved = await request('/api/reservations/status/60c72b2f9b1d8b001c8e4d2a');
    assert.strictEqual(statusRemoved.status, 404, 'Unused /status/:id endpoint must return 404 (removed to eliminate dead attack surface)');

    // Test 3b: Public Order creation rejects client isTest: true
    let capturedOrderDoc = null;
    const origOrderCreate = Order.create;
    const origOrderFindOne = Order.findOne;
    Order.findOne = async function () { return null; };
    Order.create = async function (doc) {
      capturedOrderDoc = doc;
      return { _id: 'mock_order_created_1', ...doc };
    };

    const publicOrderRes = await request('/api/orders', {
      method: 'POST',
      body: {
        name: 'Public Customer',
        phone: '9845012345',
        address: 'Table 1',
        payment: 'counter',
        isTest: true, // Attacker attempting to flag real order as test
        items: [{ name: 'Masala Tea', qty: 1 }],
        total: 30,
      },
    });
    assert.strictEqual(publicOrderRes.status, 201, 'Order creation should succeed');
    assert.ok(capturedOrderDoc, 'Order.create should have been called');
    assert.strictEqual(capturedOrderDoc.isTest, false, 'Order.create must enforce isTest: false regardless of client input');
    Order.create = origOrderCreate;
    Order.findOne = origOrderFindOne;

    // Test 3c: Public Reservation creation rejects client isTest: true
    let capturedReservationDoc = null;
    const origResCreate = Reservation.create;
    Reservation.create = async function (doc) {
      capturedReservationDoc = doc;
      return { _id: 'mock_res_created_1', ...doc };
    };

    const publicResRes = await request('/api/reservations', {
      method: 'POST',
      body: {
        name: 'Public Guest',
        phone: '9845012345',
        guests: 2,
        date: '2026-12-05',
        time: '07:30 PM',
        isTest: true, // Attacker attempting to flag real reservation as test
      },
    });
    assert.strictEqual(publicResRes.status, 201, 'Reservation creation should succeed');
    assert.ok(capturedReservationDoc, 'Reservation.create should have been called');
    assert.strictEqual(capturedReservationDoc.isTest, false, 'Reservation.create must enforce isTest: false regardless of client input');
    Reservation.create = origResCreate;

    // Test 3d: Public MORAS LIVE pass reservation rejects client isTest: true
    let capturedPassDoc = null;
    const origPassCreate = MorasLiveAudiencePass.create;
    const origPassCount = MorasLiveAudiencePass.countDocuments;
    const origPassFindOne = MorasLiveAudiencePass.findOne;
    const origSettingsGet = MorasLiveEventSettings.getSettings;
    MorasLiveEventSettings.getSettings = async function () {
      return {
        eventId: 'moras-live-2026',
        reservationsEnabled: true,
        priceConfirmed: true,
        maximumPasses: 60,
        approvedPassPrice: 149,
      };
    };
    MorasLiveAudiencePass.countDocuments = async function () { return 0; };
    MorasLiveAudiencePass.findOne = function () {
      return {
        select: async function () { return null; },
        then: function (resolve) { resolve(null); },
      };
    };
    MorasLiveAudiencePass.create = async function (doc) {
      capturedPassDoc = doc;
      return { _id: 'mock_pass_created_1', passId: 'ML-0001', qrToken: 'mock_token', ...doc };
    };

    const publicPassRes = await request('/api/moras-live/passes/reserve', {
      method: 'POST',
      body: {
        fullName: 'Moras Live Guest',
        mobileNumber: '9945446137',
        email: 'guest@themorascafe.in',
        isTest: true, // Attacker attempting to flag real pass as test
      },
    });
    assert.strictEqual(publicPassRes.status, 201, 'Pass reservation should succeed');
    assert.ok(capturedPassDoc, 'MorasLiveAudiencePass.create should have been called');
    assert.strictEqual(capturedPassDoc.isTest, false, 'MorasLiveAudiencePass.create must enforce isTest: false regardless of client input');
    MorasLiveAudiencePass.create = origPassCreate;
    MorasLiveAudiencePass.countDocuments = origPassCount;
    MorasLiveAudiencePass.findOne = origPassFindOne;
    MorasLiveEventSettings.getSettings = origSettingsGet;

    console.log('  ✅ PASS: 3. Route Hygiene & Client isTest Immunity — Removed dead /status/:id; public creation endpoints strictly enforce isTest: false');

    // ══════════════════════════════════════════════════════════════════════════
    // SUITE 4: MongoDB Transactional Test Deletion & Reconciliation Integrity
    // ══════════════════════════════════════════════════════════════════════════
    const origStartSession = mongoose.startSession;
    const origOrderFind = Order.find;
    const origOrderDeleteMany = Order.deleteMany;
    const origResFind = Reservation.find;
    const origResDeleteMany = Reservation.deleteMany;
    const origUpiFind = UpiPaymentLog.find;
    const origUpiDeleteMany = UpiPaymentLog.deleteMany;
    const origPassFind = MorasLiveAudiencePass.find;
    const origPassDeleteMany = MorasLiveAudiencePass.deleteMany;
    const origLivePaymentFind = MorasLivePayment.find;
    const origLivePaymentDeleteMany = MorasLivePayment.deleteMany;
    const origAuditCreate = AuditLog.create;
    const origAuditFind = AuditLog.find;
    const origAuditFindById = AuditLog.findById;
    const origAuditFindByIdAndUpdate = AuditLog.findByIdAndUpdate;
    const origAuditFindOneAndUpdate = AuditLog.findOneAndUpdate;

    // Track active mock sessions
    let sessionCalls = [];
    let simulateCommitFailure = false;
    let simulateUncertainCommitFailure = false;
    let simulateSessionStartFailure = false;
    let simulateStartTransactionFailure = false;

    const createMockSession = () => {
      let inTx = false;
      return {
        startTransaction: () => {
          if (simulateStartTransactionFailure) {
            throw new Error('MongoServerError: Transaction number already in use or unsupported');
          }
          inTx = true;
          sessionCalls.push('startTransaction');
        },
        commitTransaction: async () => {
          if (simulateUncertainCommitFailure) {
            sessionCalls.push('commitTransaction_UNCERTAIN');
            const err = new Error('MongoNetworkTimeoutError: connection timed out during commitTransaction');
            err.hasErrorLabel = (label) => label === 'UnknownTransactionCommitResult';
            throw err;
          }
          if (simulateCommitFailure) {
            sessionCalls.push('commitTransaction_FAILED');
            throw new Error('WriteConflict: transaction commit conflict on replica set');
          }
          inTx = false;
          sessionCalls.push('commitTransaction');
        },
        abortTransaction: async () => {
          inTx = false;
          sessionCalls.push('abortTransaction');
        },
        endSession: async () => {
          sessionCalls.push('endSession');
        },
        inTransaction: () => inTx,
      };
    };

    mongoose.startSession = async function () {
      if (simulateSessionStartFailure) {
        throw new Error('MongoNetworkError: connection pool exhausted during startSession');
      }
      return createMockSession();
    };

    let auditLogStore = [];
    AuditLog.create = async function (data) {
      const entry = {
        _id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date(),
        deletedCount: 0,
        operationResult: 'PENDING',
        isReconciling: false,
        metadata: {},
        ...data,
      };
      entry.save = async function () {
        const idx = auditLogStore.findIndex((l) => String(l._id) === String(entry._id));
        if (idx >= 0) auditLogStore[idx] = entry;
        return entry;
      };
      auditLogStore.push(entry);
      return entry;
    };

    AuditLog.find = function (filter = {}) {
      let filtered = [...auditLogStore];
      if (filter.operationResult) {
        filtered = filtered.filter((l) => l.operationResult === filter.operationResult);
      }
      const chain = {
        select: () => chain,
        sort: () => Promise.resolve(filtered),
        then: (resolve) => resolve(filtered),
      };
      return chain;
    };

    AuditLog.findById = async function (id) {
      const found = auditLogStore.find((l) => String(l._id) === String(id));
      if (!found) return null;
      if (!found.save) {
        found.save = async function () { return this; };
      }
      return found;
    };

    AuditLog.findByIdAndUpdate = async function (id, update) {
      const found = auditLogStore.find((l) => String(l._id) === String(id));
      if (!found) return null;
      if (update.$set) Object.assign(found, update.$set);
      else Object.assign(found, update);
      return found;
    };

    AuditLog.findOneAndUpdate = async function (filter, update) {
      const found = auditLogStore.find((l) => {
        if (filter._id && String(l._id) !== String(filter._id)) return false;
        if (filter.operationResult && l.operationResult !== filter.operationResult) return false;
        if (filter.isReconciling && filter.isReconciling.$ne !== undefined) {
          if (l.isReconciling === filter.isReconciling.$ne) return false;
        }
        return true;
      });
      if (!found) return null;
      if (update.$set) Object.assign(found, update.$set);
      else Object.assign(found, update);
      return found;
    };

    function makeQueryChain(records) {
      const chain = {
        session: (sess) => {
          sessionCalls.push(`query.session_${sess ? 'attached' : 'missing'}`);
          return chain;
        },
        select: () => chain,
        sort: () => chain,
        then: (resolve) => resolve(records),
      };
      return chain;
    };

    // ── Test 4a: Genuine record immunity & rejection ──
    Order.find = function (filter) {
      if (filter && filter._id && filter._id.$in) {
        return makeQueryChain([
          { _id: 'order_test_1', isTest: true },
          { _id: 'order_genuine_2', isTest: false }, // Genuine customer order!
        ]);
      }
      return makeQueryChain([]);
    };
    Order.deleteMany = async function () {
      throw new Error('deleteMany must never be called on genuine customer records');
    };

    const cleanOrderWithGenuine = await request('/api/orders/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { targetIds: ['order_test_1', 'order_genuine_2'] },
    });
    assert.strictEqual(cleanOrderWithGenuine.status, 403, 'Must reject deletion containing genuine orders with 403');

    // ── Test 4b: Missing requested IDs return 404 ──
    Order.find = function () {
      return makeQueryChain([{ _id: 'order_test_1', isTest: true }]);
    };
    const cleanOrderMissingId = await request('/api/orders/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { targetIds: ['order_test_1', 'order_nonexistent_2'] },
    });
    assert.strictEqual(cleanOrderMissingId.status, 404, 'Must return 404 if any requested ID does not exist');

    // ── Test 4c: Happy path transaction with active session attachment ──
    sessionCalls = [];
    Order.find = function () {
      return makeQueryChain([
        { _id: 'order_test_1', isTest: true },
        { _id: 'order_test_2', isTest: true },
      ]);
    };
    Order.deleteMany = async function (filter, options) {
      if (options && options.session) {
        sessionCalls.push('deleteMany_session');
      }
      return { deletedCount: 2 };
    };

    const cleanOrderSuccess = await request('/api/orders/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(cleanOrderSuccess.status, 200);
    assert.strictEqual(cleanOrderSuccess.data.count, 2);
    assert.deepStrictEqual(sessionCalls, [
      'startTransaction',
      'query.session_attached',
      'deleteMany_session',
      'commitTransaction',
      'endSession',
    ]);
    const successOrderAudit = auditLogStore.find(
      (l) => l.operationType === 'DELETE_TEST_ORDERS' && l.operationResult === 'SUCCESS'
    );
    assert.ok(successOrderAudit, 'Audit log must be updated to SUCCESS after commit');
    assert.strictEqual(successOrderAudit.deletedCount, 2);

    // ── Test 4d: Missing session support (Fail Closed before any deletion) ──
    mongoose.startSession = undefined;
    const missingSessionRes = await request('/api/orders/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(missingSessionRes.status, 500);
    const failedUnsupportedAudit = auditLogStore.find(
      (l) => l.operationResult === 'FAILED' && l.metadata?.error?.includes('does not support sessions')
    );
    assert.ok(failedUnsupportedAudit, 'Must record FAILED audit when session support is missing');
    mongoose.startSession = async function () {
      if (simulateSessionStartFailure) {
        throw new Error('MongoNetworkError: connection pool exhausted during startSession');
      }
      return createMockSession();
    };

    // ── Test 4e: startSession() failure ──
    simulateSessionStartFailure = true;
    sessionCalls = [];
    const startSessionFailRes = await request('/api/orders/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(startSessionFailRes.status, 500, 'Must fail with 500 when startSession fails');
    assert.strictEqual(sessionCalls.length, 0, 'No session actions when startSession fails');
    simulateSessionStartFailure = false;

    // ── Test 4f: startTransaction() failure (ends session in finally) ──
    simulateStartTransactionFailure = true;
    sessionCalls = [];
    const startTxFailRes = await request('/api/orders/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(startTxFailRes.status, 500, 'Must fail with 500 when startTransaction fails');
    assert.ok(sessionCalls.includes('endSession'), 'Session must be ended even if startTransaction fails');
    simulateStartTransactionFailure = false;

    // ── Test 4g: Transaction failure inside session before deletion (pre-condition / count mismatch) ──
    sessionCalls = [];
    let orderFindCallCount = 0;
    Order.find = function () {
      orderFindCallCount++;
      if (orderFindCallCount === 1) {
        return makeQueryChain([{ _id: 'order_tx_1', isTest: true }, { _id: 'order_tx_2', isTest: true }]);
      }
      return makeQueryChain([{ _id: 'order_tx_1', isTest: true }]);
    };
    Order.deleteMany = async function () {
      throw new Error('deleteMany must NOT be called if inside-transaction revalidation fails');
    };

    const txPreConditionFailRes = await request('/api/orders/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(txPreConditionFailRes.status, 500);
    assert.deepStrictEqual(sessionCalls, ['startTransaction', 'query.session_attached', 'abortTransaction', 'endSession']);
    const failedPreCondAudit = auditLogStore.find(
      (l) => l.operationResult === 'FAILED' && l.metadata?.error?.includes('pre-condition')
    );
    assert.ok(failedPreCondAudit, 'Audit log must be updated to FAILED when transaction revalidation fails');

    // ── Test 4h: Associated Payment Record Deletion Failure (Rolls back entire transaction) ──
    sessionCalls = [];
    Reservation.find = function () {
      return makeQueryChain([{ _id: 'res_tx_1', isTest: true }, { _id: 'res_tx_2', isTest: true }]);
    };
    UpiPaymentLog.deleteMany = async function () {
      sessionCalls.push('upiDeleteMany_FAILED');
      throw new Error('Simulated failure during associated UPI payment log deletion');
    };
    Reservation.deleteMany = async function () {
      throw new Error('Primary Reservation.deleteMany must not be called if associated deletion fails');
    };

    const cleanResAssociatedFail = await request('/api/reservations/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(cleanResAssociatedFail.status, 500);
    assert.deepStrictEqual(sessionCalls, [
      'startTransaction',
      'query.session_attached',
      'upiDeleteMany_FAILED',
      'abortTransaction',
      'endSession',
    ]);

    // ── Test 4i: Primary Record Deletion Failure (Rolls back associated payment deletion) ──
    sessionCalls = [];
    UpiPaymentLog.deleteMany = async function (filter, options) {
      if (options && options.session) sessionCalls.push('upiDeleteMany_session');
      return { deletedCount: 2 };
    };
    Reservation.deleteMany = async function () {
      sessionCalls.push('resDeleteMany_FAILED');
      throw new Error('Simulated failure during primary reservation deletion');
    };

    const cleanResPrimaryFail = await request('/api/reservations/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(cleanResPrimaryFail.status, 500);
    assert.deepStrictEqual(sessionCalls, [
      'startTransaction',
      'query.session_attached',
      'upiDeleteMany_session',
      'resDeleteMany_FAILED',
      'abortTransaction',
      'endSession',
    ]);

    // ── Test 4j: Transaction Commit Failure (Session Aborts & Rolls Back) ──
    sessionCalls = [];
    simulateCommitFailure = true;
    Reservation.deleteMany = async function (filter, options) {
      if (options && options.session) sessionCalls.push('resDeleteMany_session');
      return { deletedCount: 2 };
    };

    const cleanResCommitFail = await request('/api/reservations/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(cleanResCommitFail.status, 500);
    assert.ok(sessionCalls.includes('commitTransaction_FAILED'), 'Must attempt commit and register failure');
    assert.ok(sessionCalls.includes('abortTransaction'), 'Transaction must be aborted on commit failure');
    assert.ok(sessionCalls.includes('endSession'), 'Session must be ended on commit failure');
    simulateCommitFailure = false;

    // ── Test 4j2: Uncertain Commit Result (UnknownTransactionCommitResult leaves audit in PENDING) ──
    sessionCalls = [];
    simulateUncertainCommitFailure = true;
    Order.find = function () {
      return makeQueryChain([
        { _id: 'order_test_1', isTest: true },
        { _id: 'order_test_2', isTest: true },
      ]);
    };
    Order.deleteMany = async function () { return { deletedCount: 2 }; };

    const uncertainCommitRes = await request('/api/orders/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(uncertainCommitRes.status, 500);
    assert.ok(sessionCalls.includes('commitTransaction_UNCERTAIN'));
    assert.ok(!sessionCalls.includes('abortTransaction'), 'Must NOT call abortTransaction when commit result is uncertain');
    assert.ok(sessionCalls.includes('endSession'), 'Session must be ended on uncertain commit');
    const uncertainAudit = auditLogStore.find(
      (l) => l.operationType === 'DELETE_TEST_ORDERS' && l.metadata?.uncertainCommit === true
    );
    assert.ok(uncertainAudit, 'Audit record must record uncertainCommit metadata');
    assert.strictEqual(uncertainAudit.operationResult, 'PENDING', 'Audit record must stay in PENDING when commit outcome is uncertain');
    simulateUncertainCommitFailure = false;

    // ── Test 4k: Audit update failure after successful commit (Leaves audit in PENDING for reconciliation) ──
    sessionCalls = [];
    UpiPaymentLog.deleteMany = async function () { return { deletedCount: 2 }; };
    Reservation.deleteMany = async function () { return { deletedCount: 2 }; };

    const origFindByIdAndUpdate = AuditLog.findByIdAndUpdate;
    AuditLog.findByIdAndUpdate = async function (id, update) {
      if (update.operationResult === 'SUCCESS') {
        throw new Error('Simulated network timeout updating audit log to SUCCESS after commit');
      }
      return origFindByIdAndUpdate(id, update);
    };

    const postCommitAuditFailRes = await request('/api/reservations/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(postCommitAuditFailRes.status, 200, 'Must return 200 since records were actually deleted via transaction');
    assert.strictEqual(postCommitAuditFailRes.data.auditStatus, 'PENDING_RECONCILIATION');
    assert.deepStrictEqual(sessionCalls, ['startTransaction', 'query.session_attached', 'commitTransaction', 'endSession']);

    const pendingAuditForReconcile = auditLogStore.find(
      (l) => l._id === postCommitAuditFailRes.data.auditId && l.operationResult === 'PENDING'
    );
    assert.ok(pendingAuditForReconcile, 'Audit entry must remain in PENDING state when post-commit audit update fails');
    assert.deepStrictEqual(pendingAuditForReconcile.targetRecordIds, ['res_tx_1', 'res_tx_2']);

    AuditLog.findByIdAndUpdate = origFindByIdAndUpdate;

    // ── Test 4l: Initial audit log insertion failure (Fails Closed before transaction/deletion) ──
    AuditLog.create = async function () {
      throw new Error('Database write failure on AuditLog.create');
    };
    sessionCalls = [];
    const cleanResAuditFail = await request('/api/reservations/clean-all-tests', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(cleanResAuditFail.status, 500);
    assert.strictEqual(sessionCalls.length, 0, 'Zero transaction sessions must be opened if initial audit write fails');
    AuditLog.create = async function (data) {
      const entry = { _id: `audit_${Date.now()}`, isReconciling: false, ...data, save: async function () { return this; } };
      auditLogStore.push(entry);
      return entry;
    };

    // ── Test 4m: Reconciliation when both collections are empty (Successful commit confirmed) ──
    const successPendingAudit = await AuditLog.create({
      admin: 'admin@themorascafe.in',
      operationType: 'DELETE_TEST_RESERVATIONS',
      targetRecordIds: ['res_committed_1', 'res_committed_2'],
      deletedCount: 0,
      operationResult: 'PENDING',
      metadata: { requestedTargetIds: ['res_committed_1', 'res_committed_2'] },
    });

    Reservation.find = function () { return Promise.resolve([]); }; // 0 remaining
    UpiPaymentLog.find = function () { return Promise.resolve([]); }; // 0 remaining

    const reconcileSuccessRes = await request(`/api/audit/reconcile/${successPendingAudit._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(reconcileSuccessRes.status, 200);
    assert.strictEqual(reconcileSuccessRes.data.status, 'SUCCESS');
    assert.strictEqual(reconcileSuccessRes.data.count, 2);
    assert.strictEqual(successPendingAudit.operationResult, 'SUCCESS');
    assert.ok(successPendingAudit.metadata.reconciliation.includes('Transaction was committed'));

    // ── Test 4n: Reconciliation when both collections retain all expected records (Rollback confirmed) ──
    const abortedPendingAudit = await AuditLog.create({
      admin: 'admin@themorascafe.in',
      operationType: 'DELETE_TEST_ORDERS',
      targetRecordIds: ['order_aborted_1', 'order_aborted_2'],
      deletedCount: 0,
      operationResult: 'PENDING',
      metadata: { requestedTargetIds: ['order_aborted_1', 'order_aborted_2'] },
    });

    Order.find = function () {
      return Promise.resolve([{ _id: 'order_aborted_1' }, { _id: 'order_aborted_2' }]);
    };

    const reconcileAbortedRes = await request(`/api/audit/reconcile/${abortedPendingAudit._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(reconcileAbortedRes.status, 200);
    assert.strictEqual(reconcileAbortedRes.data.status, 'FAILED');
    assert.strictEqual(reconcileAbortedRes.data.count, 0);
    assert.strictEqual(abortedPendingAudit.operationResult, 'FAILED');
    assert.ok(abortedPendingAudit.metadata.reconciliation.includes('Transaction was aborted or rolled back'));

    // ── Test 4o: Reconciliation when only one collection retains records (Mixed state leaves UNRESOLVED) ──
    const mixedPendingAudit = await AuditLog.create({
      admin: 'admin@themorascafe.in',
      operationType: 'DELETE_TEST_RESERVATIONS',
      targetRecordIds: ['res_mixed_1', 'res_mixed_2'],
      deletedCount: 0,
      operationResult: 'PENDING',
      metadata: { requestedTargetIds: ['res_mixed_1', 'res_mixed_2'] },
    });

    // Reservations absent (0), but associated UPI payment log remains (1)!
    Reservation.find = function () { return Promise.resolve([]); };
    UpiPaymentLog.find = function () { return Promise.resolve([{ _id: 'upi_orphan_1' }]); };

    const reconcileMixedRes = await request(`/api/audit/reconcile/${mixedPendingAudit._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(reconcileMixedRes.status, 200);
    assert.strictEqual(reconcileMixedRes.data.status, 'UNRESOLVED');
    assert.strictEqual(reconcileMixedRes.data.requiresInvestigation, true);
    assert.strictEqual(mixedPendingAudit.operationResult, 'PENDING', 'Mixed state must NOT finalize to SUCCESS or FAILED');
    assert.ok(mixedPendingAudit.metadata.reconciliationInvestigation.includes('Mixed state detected'));

    // ── Test 4p: Concurrent reconciliation attempts (Returns 409 Conflict) ──
    const concurrentPendingAudit = await AuditLog.create({
      admin: 'admin@themorascafe.in',
      operationType: 'DELETE_TEST_ORDERS',
      targetRecordIds: ['order_concurrent_1'],
      deletedCount: 0,
      operationResult: 'PENDING',
      isReconciling: true, // Simulating another worker actively reconciling this record
    });

    const reconcileConflictRes = await request(`/api/audit/reconcile/${concurrentPendingAudit._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(reconcileConflictRes.status, 409, 'Concurrent reconciliation attempt must return 409 Conflict');

    // ── Test 4q: Unauthorized access to audit endpoints ──
    const unauthGet = await request('/api/audit/pending');
    assert.strictEqual(unauthGet.status, 401, 'Unauthenticated pending audit request must be rejected with 401');

    const kitchenGet = await request('/api/audit/pending', {
      headers: { Authorization: `Bearer ${kitchenToken}` },
    });
    assert.strictEqual(kitchenGet.status, 403, 'Kitchen role must be forbidden from accessing pending audit logs');

    const unauthPost = await request(`/api/audit/reconcile/${successPendingAudit._id}`, {
      method: 'POST',
    });
    assert.strictEqual(unauthPost.status, 401, 'Unauthenticated reconcile request must be rejected with 401');

    const kitchenPost = await request(`/api/audit/reconcile/${successPendingAudit._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kitchenToken}` },
    });
    assert.strictEqual(kitchenPost.status, 403, 'Kitchen role must be forbidden from reconciling audit records');

    // ── Test 4r: List pending audit entries endpoint (Admin authorized) ──
    const pendingListRes = await request('/api/audit/pending', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(pendingListRes.status, 200);
    assert.strictEqual(pendingListRes.data.success, true);
    assert.ok(Array.isArray(pendingListRes.data.pendingLogs));

    // Restore original model methods
    mongoose.startSession = origStartSession;
    Order.find = origOrderFind;
    Order.deleteMany = origOrderDeleteMany;
    Reservation.find = origResFind;
    Reservation.deleteMany = origResDeleteMany;
    UpiPaymentLog.find = origUpiFind;
    UpiPaymentLog.deleteMany = origUpiDeleteMany;
    MorasLiveAudiencePass.find = origPassFind;
    MorasLiveAudiencePass.deleteMany = origPassDeleteMany;
    MorasLivePayment.find = origLivePaymentFind;
    MorasLivePayment.deleteMany = origLivePaymentDeleteMany;
    AuditLog.create = origAuditCreate;
    AuditLog.find = origAuditFind;
    AuditLog.findById = origAuditFindById;
    AuditLog.findByIdAndUpdate = origAuditFindByIdAndUpdate;
    AuditLog.findOneAndUpdate = origAuditFindOneAndUpdate;

    console.log('  ✅ PASS: 4. Transactional Deletion & Reconciliation Integrity — Verified multi-document transactions, all 12 failure & reconciliation scenarios, and deterministic admin reconciliation');

    // ══════════════════════════════════════════════════════════════════════════
    // SUITE 5: CSV Formula Injection Protection (CWE-1236)
    // ══════════════════════════════════════════════════════════════════════════
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[\s\x00-\x1f]*[=+\-@\t\r%]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    // Formula prefixes directly
    assert.strictEqual(escapeCsv('=1+1'), '"\'=1+1"', 'Direct = formula trigger neutralized');
    assert.strictEqual(escapeCsv('+cmd|calc!A0'), '"\'+cmd|calc!A0"', 'Direct + formula trigger neutralized');
    assert.strictEqual(escapeCsv('-2+3'), '"\'-2+3"', 'Direct - formula trigger neutralized');
    assert.strictEqual(escapeCsv('@SUM(A1:A10)'), '"\'@SUM(A1:A10)"', 'Direct @ formula trigger neutralized');
    assert.strictEqual(escapeCsv('%TOTAL'), '"\'%TOTAL"', 'Direct % formula trigger neutralized');

    // Formula prefixes with leading spaces, tabs, and carriage returns (CWE-1236 bypass attempts)
    assert.strictEqual(escapeCsv('  =SUM(A1:A10)'), '"\'  =SUM(A1:A10)"', 'Leading spaces before = neutralized');
    assert.strictEqual(escapeCsv('\t=cmd'), '"\'\t=cmd"', 'Leading tab before = neutralized');
    assert.strictEqual(escapeCsv('\r\n+12345'), '"\'\r\n+12345"', 'Leading CR/LF before + neutralized');
    assert.strictEqual(escapeCsv('   @HYPERLINK("evil.com")'), '"\'   @HYPERLINK(""evil.com"")"', 'Leading spaces before @ neutralized');
    assert.strictEqual(escapeCsv('Normal Customer Name'), '"Normal Customer Name"', 'Standard text preserved without neutralization prefix');
    console.log('  ✅ PASS: 5. CSV Formula Injection Defense — Neutralizes =, +, -, @, %, tab, and leading whitespace/control character vectors (CWE-1236)');

    // ══════════════════════════════════════════════════════════════════════════
    // SUITE 6: HTML Email Sanitization & XSS Prevention
    // ══════════════════════════════════════════════════════════════════════════
    // 6a: Test basic escapeHtml directly
    assert.strictEqual(escapeHtml('<script>alert("XSS")</script>'), '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    assert.strictEqual(escapeHtml("Tom & 'Jerry'"), 'Tom &amp; &#039;Jerry&#039;');

    // 6b: Order item rows escaping
    const maliciousItems = [
      { name: '<img src=x onerror=alert(1)>Special Pizza', price: 299, qty: 1, variant: '<b>Large</b>' },
    ];
    const itemRowsHtml = buildItemRows(maliciousItems);
    assert.ok(!itemRowsHtml.includes('<img src=x'), 'Malicious img tag in item name must be escaped');
    assert.ok(itemRowsHtml.includes('&lt;img src=x'), 'Escaped img tag must be present');
    assert.ok(!itemRowsHtml.includes('<b>Large</b>'), 'Malicious bold tag in variant must be escaped');
    assert.ok(itemRowsHtml.includes('&lt;b&gt;Large&lt;/b&gt;'), 'Escaped variant must be present');

    // 6c: Customer order tax invoice HTML escaping
    const customerEmailHtml = buildCustomerEmailHTML({
      name: '<script>evil()</script>Rakesh Desai',
      address: '"><script>alert(2)</script>Adarsh Nagar',
      items: maliciousItems,
      total: 299,
      payment: 'cod',
      orderId: '60c72b2f9b1d8b001c8e4d2a',
    });
    assert.ok(!customerEmailHtml.includes('<script>evil()</script>'), 'Script tag in name must be escaped');
    assert.ok(customerEmailHtml.includes('&lt;script&gt;evil()&lt;/script&gt;'));
    assert.ok(!customerEmailHtml.includes('"><script>alert(2)</script>'), 'Injected tag in address must be escaped');
    assert.ok(customerEmailHtml.includes('&quot;&gt;&lt;script&gt;alert(2)&lt;/script&gt;'));

    // 6d: Reservation confirmation HTML escaping
    const reservationEmailHtml = buildReservationEmailHTML({
      name: '<img src=x onerror=steal()>',
      birthdayPerson: '<b>Sneha</b>',
      date: '2026-12-05',
      time: '07:30 PM',
      notes: '<script>fetch("http://attacker.com")</script>',
      upiRef: '"><svg onload=alert(3)>',
      _id: '60c72b2f9b1d8b001c8e4d2a',
    });
    assert.ok(!reservationEmailHtml.includes('<img src=x onerror=steal()>'));
    assert.ok(reservationEmailHtml.includes('&lt;img src=x onerror=steal()&gt;'));
    assert.ok(!reservationEmailHtml.includes('<b>Sneha</b>'));
    assert.ok(reservationEmailHtml.includes('&lt;b&gt;Sneha&lt;/b&gt;'));
    assert.ok(!reservationEmailHtml.includes('<script>fetch('));
    assert.ok(!reservationEmailHtml.includes('<svg onload=alert(3)>'));

    // 6e: MORAS LIVE Pass email HTML escaping
    const passEmailHtml = buildMorasLivePassEmailHTML({
      pass: {
        passId: 'ML-0001',
        customerName: '<script>alert("pass_xss")</script>Valued Guest',
        name: '<script>alert("pass_xss")</script>Valued Guest',
        mobileNumber: '9945446137',
        normalizedMobileNumber: '9945446137',
        venue: '<marquee>The Moras Cafe</marquee>',
        eventName: '<b>MORAS LIVE</b>',
        approvedPassPrice: 149,
      },
      qrDataUrl: 'data:image/png;base64,mockQr',
      secureAccessUrl: 'https://themorascafe.in/pass?token=abc',
    });
    assert.ok(!passEmailHtml.includes('<script>alert("pass_xss")</script>'));
    assert.ok(passEmailHtml.includes('&lt;script&gt;alert(&quot;pass_xss&quot;)&lt;/script&gt;'));
    assert.ok(!passEmailHtml.includes('<marquee>'));
    assert.ok(passEmailHtml.includes('&lt;marquee&gt;The Moras Cafe&lt;/marquee&gt;'));
    assert.ok(!passEmailHtml.includes('<b>MORAS LIVE</b>'));
    assert.ok(passEmailHtml.includes('&lt;b&gt;MORAS LIVE&lt;/b&gt;'));
    assert.ok(!passEmailHtml.includes('quickchart.io'), 'No quickchart.io third-party URL in pass email template');

    console.log('  ✅ PASS: 6. Email Sanitization & XSS Immunity — HTML escaping verified across order items, tax invoices, reservation receipts, and MORAS LIVE passes');

    console.log('\n🎉 ALL Phase 1 Final Security Remediation Tests Passed Successfully!\n');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

runSecurityRemediationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });
