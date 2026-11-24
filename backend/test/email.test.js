const assert = require('assert');
const http = require('http');

// Test Suite for Brevo Branded Email Integration and Multi-tier Fallback
async function runTests() {
  console.log('🧪 Starting Brevo Email Integration & Fallback Tests...\n');

  // Test 1: Module exports and diagnostics
  const emailModule = require('../src/utils/email');
  assert(typeof emailModule.sendOrderEmail === 'function', 'sendOrderEmail must be exported');
  assert(typeof emailModule.sendReservationEmail === 'function', 'sendReservationEmail must be exported');
  assert(typeof emailModule.sendMorasLivePerformerEmail === 'function', 'sendMorasLivePerformerEmail must be exported');
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

  // Test 5: MORAS LIVE Performer Confirmation Email generation & sanitization
  const mockRegistration = {
    registrationId: 'ML-998877',
    fullName: '<script>alert(1)</script>Aarav Sharma',
    email: 'aarav@example.com',
    participationRole: 'Singer',
    otherRole: '',
    instagramUsername: 'aaravmusic',
  };
  const performerHtml = emailModule.buildMorasLivePerformerEmailHTML({
    registration: mockRegistration,
    customSlot: '<b>Saturday 7:30 PM</b>',
    customMessage: '<img src=x onerror=alert(2)>Excited to have you!',
  });
  assert.ok(!performerHtml.includes('<script>alert(1)</script>'), 'Script tag in performer name must be escaped');
  assert.ok(performerHtml.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'Performer name must be escaped');
  assert.ok(!performerHtml.includes('<b>Saturday'), 'HTML tags in custom slot must be escaped');
  assert.ok(performerHtml.includes('&lt;b&gt;Saturday'), 'Custom slot must be escaped');
  assert.ok(!performerHtml.includes('<img src=x'), 'HTML tags in custom message must be escaped');
  assert.ok(performerHtml.includes('ML-998877'), 'Registration ID must be present');
  assert.ok(performerHtml.includes('Singer'), 'Participation role must be present');
  assert.ok(performerHtml.includes('Artist Briefing &amp; Event Guidelines'), 'Guidelines must be present');

  const performerText = emailModule.buildMorasLivePerformerEmailText({
    registration: mockRegistration,
    customSlot: 'Saturday 7:30 PM',
    customMessage: 'Excited to have you!',
  });
  assert.ok(performerText.includes('ML-998877'));
  assert.ok(performerText.includes('Saturday 7:30 PM'));

  const performerEmailRes = await emailModule.sendMorasLivePerformerEmail({});
  assert.strictEqual(performerEmailRes.success, false, 'Should fail gracefully if performer has no email');
  console.log('  ✅ PASS: 5. MORAS LIVE Performer confirmation email generation, sanitization & fallback verified');

  // Test 6: MORAS LIVE Performer Rejection / Non-Selection Email generation & sanitization (Top 4 policy)
  assert(typeof emailModule.sendMorasLiveRejectionEmail === 'function', 'sendMorasLiveRejectionEmail must be exported');
  const rejectionHtml = emailModule.buildMorasLiveRejectionEmailHTML({
    registration: mockRegistration,
    customMessage: '<script>evil()</script>Special message to artist',
  });
  assert.ok(!rejectionHtml.includes('<script>evil()</script>'), 'Script tag in custom message must be escaped');
  assert.ok(rejectionHtml.includes('&lt;script&gt;evil()&lt;/script&gt;'), 'Custom message must be escaped');
  assert.ok(!rejectionHtml.includes('<script>alert(1)</script>'), 'Script tag in applicant name must be escaped');
  assert.ok(rejectionHtml.includes('ML-998877'), 'Registration ID must be present');
  assert.ok(rejectionHtml.includes('top 4 featured performances'), 'Top 4 policy context must be clearly stated');
  assert.ok(rejectionHtml.includes('Featured Artist Roster'), 'Featured Artist Roster mention must be present');

  const rejectionText = emailModule.buildMorasLiveRejectionEmailText({
    registration: mockRegistration,
    customMessage: 'Special message to artist',
  });
  assert.ok(rejectionText.includes('ML-998877'));
  assert.ok(rejectionText.includes('top 4 featured performance acts'));

  const rejectionEmailRes = await emailModule.sendMorasLiveRejectionEmail({});
  assert.strictEqual(rejectionEmailRes.success, false, 'Should fail gracefully if rejection recipient has no email');
  console.log('  ✅ PASS: 6. MORAS LIVE Professional rejection (top 4 policy) email generation, sanitization & fallback verified');

  console.log('\n🎉 All Email integration checks passed successfully!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
