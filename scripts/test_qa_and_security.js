const http = require('http');

async function testQAAndSecurity() {
  console.log('================================================================');
  console.log('   PRINCIPAL QA & APPSEC VERIFICATION SUITE — PAIRS CLOTHING    ');
  console.log('================================================================\n');

  // Wait 2 seconds for Next.js dev server readiness
  await new Promise((r) => setTimeout(r, 2000));

  // --- TEST 1: Bank Details & Custom Policy Persistence in SQLite ---
  console.log('>>> TEST 1: Saving Custom Bank Details & Store Policies via Admin API...');
  const customBankName = 'Meezan Bank Ltd (Gulberg Branch)';
  const customIban = 'PK36MEZN0001020304050607';
  const customRefundPolicy = 'OFFICIAL PAIRS 14-DAY HASSLE-FREE SIZE EXCHANGE\nItems must be unwashed with tags attached.';

  const saveSettingsRes = await fetch('http://localhost:3000/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enableBankTransfer: true,
      bankName: customBankName,
      bankAccountTitle: 'PAIRS CLOTHING PVT LTD',
      bankAccountNumber: '01020304050607',
      bankIban: customIban,
      bankBranch: 'Gulberg III, Lahore',
      bankInstructions: 'WhatsApp receipt to +92 300 1234567 after transfer',
      policyRefund: customRefundPolicy,
      enableCod: true,
      enableCard: true,
    }),
  });
  const saveSettingsData = await saveSettingsRes.json();
  console.log('  [Settings Save Status]:', saveSettingsRes.status, '| Success:', saveSettingsData.success);

  // Verify in GET /api/admin/settings
  const verifySettings = await fetch('http://localhost:3000/api/admin/settings').then((r) => r.json());
  if (verifySettings.store?.bankName !== customBankName) {
    throw new Error('Bank details persistence check failed in SQLite!');
  }
  if (verifySettings.store?.policyRefund !== customRefundPolicy) {
    throw new Error('Custom policy persistence check failed in SQLite!');
  }
  console.log('  ✓ Bank Name Verified in DB:', verifySettings.store?.bankName);
  console.log('  ✓ Custom Policy Verified in DB:', verifySettings.store?.policyRefund.split('\n')[0]);

  // Verify rendered policy page
  const policyPageHtml = await fetch('http://localhost:3000/policies/refund-policy').then((r) => r.text());
  if (!policyPageHtml.includes('OFFICIAL PAIRS 14-DAY HASSLE-FREE SIZE EXCHANGE')) {
    throw new Error('Policy page did not dynamically render custom text from SQLite!');
  }
  console.log('  ✓ Storefront /policies/refund-policy HTML verified rendering custom policy!\n');

  // --- TEST 2: Coupon Creation Unique Constraint & Error Alert Elimination (Screenshot 1 Bugfix) ---
  console.log('>>> TEST 2: Testing Duplicate Coupon Handling (Screenshot 1 Bugfix)...');
  const duplicateCouponRes = await fetch('http://localhost:3000/api/admin/discounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'WELCOME10', // already exists in DB
      type: 'PERCENTAGE',
      value: 10,
    }),
  });
  const duplicateCouponData = await duplicateCouponRes.json();
  console.log('  [Duplicate Coupon Status]:', duplicateCouponRes.status, '| Error message:', duplicateCouponData.error);
  if (duplicateCouponRes.status !== 400 || !duplicateCouponData.error) {
    throw new Error('Duplicate coupon check failed: expected 400 status with friendly error!');
  }
  console.log('  ✓ Duplicate coupon caught gracefully with friendly message (Zero 500 / Zero Prisma alerts)!\n');

  // --- TEST 3: AppSec Attack — Price Tampering Attack ---
  console.log('>>> TEST 3: Testing AppSec Price Tampering Resistance...');
  // Attacker attempts to buy Black Wash Bootcut (3,199 PKR) for 10 PKR
  const priceTamperPayload = {
    customerName: 'Hacker Tester',
    customerPhone: '0321 9988776',
    shippingAddress: 'Plot 10, Sector G-11',
    city: 'Islamabad',
    subtotalPrice: 10, // Tampered client price!
    totalPrice: 10, // Tampered client price!
    paymentMethod: 'COD',
    items: [
      {
        productId: 'cmwhpsgrp0005ut04dcyueyhv',
        variantId: 'cmwhpsgrt0008ut04bh0r6xcz',
        title: 'Black Wash Bootcut',
        variantTitle: 'Waist 32',
        price: 10, // Tampered client item price!
        quantity: 1,
      },
    ],
  };

  const tamperRes = await fetch('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(priceTamperPayload),
  });
  const tamperData = await tamperRes.json();
  console.log('  [Checkout API Response]:', tamperRes.status, '| Recorded Total:', tamperData.order?.totalPrice);
  // Authoritative price is 3,199 + 250 shipping = 3,449 PKR
  if (tamperData.order?.totalPrice !== 3449) {
    throw new Error(`Price tampering check failed! Expected authoritative total 3,449 PKR but got: ${tamperData.order?.totalPrice}`);
  }
  console.log('  ✓ Server-side price authority confirmed: Client 10 PKR override was rejected, authoritative DB total 3,449 PKR enforced!\n');

  // --- TEST 4: AppSec Attack — Negative Quantity Attack ---
  console.log('>>> TEST 4: Testing AppSec Negative Quantity Attack...');
  const negQtyPayload = {
    customerName: 'Negative Qty Tester',
    customerPhone: '0321 1122334',
    shippingAddress: 'Mall Road',
    city: 'Lahore',
    items: [
      {
        productId: 'cmwhpsgrp0005ut04dcyueyhv',
        variantId: 'cmwhpsgrt0008ut04bh0r6xcz',
        title: 'Black Wash Bootcut',
        price: 3199,
        quantity: -5, // Malicious negative quantity!
      },
    ],
  };

  const negQtyRes = await fetch('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(negQtyPayload),
  });
  const negQtyData = await negQtyRes.json();
  console.log('  [Negative Qty Status]:', negQtyRes.status, '| Error:', negQtyData.error);
  if (negQtyRes.status !== 400) {
    throw new Error('Negative quantity attack was not rejected with status 400!');
  }
  console.log('  ✓ Negative quantity attack successfully rejected with status 400!\n');

  // --- TEST 5: Rapid Multi-Click Double Submit Protection (Idempotency) ---
  console.log('>>> TEST 5: Testing Rapid Multi-Click / Double Submit Idempotency...');
  const rapidClickPayload = {
    customerName: 'Rapid Clicker',
    customerPhone: '0300 7776655',
    shippingAddress: 'House 55, Street 2, DHA Phase 5',
    city: 'Lahore',
    paymentMethod: 'BANK_TRANSFER',
    items: [
      {
        productId: 'cmwhpsgrp0005ut04dcyueyhv',
        variantId: 'cmwhpsgrt0008ut04bh0r6xcz',
        title: 'Black Wash Bootcut',
        variantTitle: 'Waist 32',
        quantity: 1,
      },
    ],
  };

  // Fire 3 simultaneous checkout requests in parallel (simulating 3 rapid clicks)
  console.log('  Firing 3 simultaneous checkout requests in parallel...');
  const [res1, res2, res3] = await Promise.all([
    fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rapidClickPayload),
    }).then((r) => r.json()),
    fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rapidClickPayload),
    }).then((r) => r.json()),
    fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rapidClickPayload),
    }).then((r) => r.json()),
  ]);

  console.log('  Call 1 Result: Order #', res1.order?.orderNumber, '| Duplicate Prevented:', res1.duplicatePrevented || false);
  console.log('  Call 2 Result: Order #', res2.order?.orderNumber, '| Duplicate Prevented:', res2.duplicatePrevented || false);
  console.log('  Call 3 Result: Order #', res3.order?.orderNumber, '| Duplicate Prevented:', res3.duplicatePrevented || false);

  if (res1.order?.orderNumber !== res2.order?.orderNumber || res1.order?.orderNumber !== res3.order?.orderNumber) {
    throw new Error('Idempotency failure! Multi-clicks generated separate duplicate orders!');
  }
  console.log('  ✓ Multi-click idempotency verified: Exactly 1 order was generated, and duplicate calls returned existing order!\n');

  // --- TEST 6: Direct Bank Transfer Flow Verification ---
  console.log('>>> TEST 6: Direct Bank Transfer Flow Verification...');
  console.log('  Order #', res1.order?.orderNumber, 'Payment Method:', res1.order?.paymentMethod);
  if (res1.order?.paymentMethod !== 'BANK_TRANSFER') {
    throw new Error('Payment method was not recorded as BANK_TRANSFER!');
  }
  const successPageHtml = await fetch(`http://localhost:3000/order-success?orderNumber=${res1.order.orderNumber}`).then((r) => r.text());
  if (!successPageHtml.includes('Direct Bank Transfer Instructions') || !successPageHtml.includes(customIban)) {
    throw new Error('Order success screen did not display bank transfer instructions or IBAN!');
  }
  console.log('  ✓ Order success screen correctly rendered bank transfer instructions & IBAN!\n');

  // --- TEST 7: Phone Normalization for Pakistan ---
  console.log('>>> TEST 7: Phone Normalization for Pakistan (+92 E.164)...');
  console.log('  Input Phone: "0300 7776655" -> Stored Phone:', res1.order?.customerPhone);
  if (res1.order?.customerPhone !== '+923007776655') {
    throw new Error(`Phone normalization failed! Expected "+923007776655" but got: "${res1.order?.customerPhone}"`);
  }
  console.log('  ✓ Phone normalization verified: Formatted to standard +923007776655 for reliable WhatsApp integration!\n');

  console.log('========================================================================');
  console.log('>>> ALL 7 PRINCIPAL QA & APPSEC VERIFICATIONS PASSED WITH 100% SUCCESS <<<');
  console.log('========================================================================');
}

testQAAndSecurity().catch((err) => {
  console.error('\n❌ QA SUITE FAILED:', err);
  process.exit(1);
});
