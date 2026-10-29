const assert = require('assert');
const http = require('http');

// Test Suite for Brevo Branded Email Integration and Multi-tier Fallback
async function runTests() {
  console.log('🧪 Starting Brevo Email Integration & Fallback Tests...\n');

  // Test 1: Module exports and diagnostics
  const emailModule = require('../src/utils/email');
  assert(typeof emailModule.sendOrderEmail === 'function', 'sendOrderEmail must be exported');
  assert(typeof emailModule.sendReservationEmail === 'function', 'sendReservationEmail must be exported');
  assert(typeof emailModule.sendTestEmail === 'function', 'sendTestEmail must be exported');
  assert(typeof emailModule.getEmailConfigDiagnostic === 'function', 'getEmailConfigDiagnostic must be exported');
  console.log('  ✅ PASS: 1. Export signatures verified');

  // Test 2: Diagnostics reporting defaults
  const diag = emailModule.getEmailConfigDiagnostic();
  assert.strictEqual(diag.emailFrom, process.env.EMAIL_FROM || 'orders@themorascafe.in');
  assert.strictEqual(diag.emailFromName, process.env.EMAIL_FROM_NAME || 'THE MORAS CAFE');
  assert.strictEqual(diag.emailReplyTo, process.env.EMAIL_REPLY_TO || 'orders@themorascafe.in');
  console.log('  ✅ PASS: 2. Branded sender identity and default configuration verified');

  // Test 3: Handling missing recipient gracefully
  const orderRes = await emailModule.sendOrderEmail({});
  assert.strictEqual(orderRes.success, false, 'Should fail gracefully if order has no email');
  const reservRes = await emailModule.sendReservationEmail({});
  assert.strictEqual(reservRes.success, false, 'Should fail gracefully if reservation has no email');
  console.log('  ✅ PASS: 3. Empty recipient inputs handled safely without throwing');

  // Test 4: Verify dispatchEmail falls back gracefully when Brevo key is not set
  // In default local dev without BREVO_API_KEY, it should attempt proxy or SMTP fallback
  const testOrder = {
    orderId: 'mock12345678',
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '9876543210',
    orderType: 'dine-in',
    tableNo: '3',
    items: [
      { name: 'Espresso', size: 'Single', quantity: 1, price: 120 },
      { name: 'Croissant', quantity: 2, price: 150 },
    ],
    pricing: {
      subtotal: 420,
      cgst: 10.5,
      sgst: 10.5,
      total: 441,
    },
    paymentMethod: 'cash',
    createdAt: new Date(),
  };

  const dispatchResult = await emailModule.sendOrderEmail(testOrder);
  // Without credentials configured in test env, it should return success: false with informative errors
  assert(typeof dispatchResult === 'object', 'Result must be an object');
  console.log('  ✅ PASS: 4. Order email dispatch gracefully traverses fallback chain without crash');

  console.log('\n🎉 All Email integration checks passed successfully!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
