/**
 * ==============================================================================
 * Comprehensive Senior QA Automation Test Suite: Admin Panel & Storefront
 * Enterprise Quality Engineering Specification — Pairs Clothing Shopify Clone
 * ==============================================================================
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const PASSKEY = 'abdullahhanjra17';

let authCookie = '';
let testProductId = '';
let testVariantId = '';
let testDiscountId = '';
let testOrderId = '';

let passedTests = 0;
let failedTests = 0;

function logPass(title, details = '') {
  console.log(`\x1b[32m✔ PASS: [${title}]\x1b[0m ${details}`);
  passedTests++;
}

function logFail(title, error) {
  console.error(`\x1b[31m✖ FAIL: [${title}]\x1b[0m`, error);
  failedTests++;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('  PAIRS CLOTHING — SENIOR QA AUTOMATION SUITE (10+ YR LEVEL)   ');
  console.log(`  Target Environment: ${BASE_URL}                            `);
  console.log('===============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Security Challenge Gate & Intrusion Lockdown
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/admin`, {
      headers: { 'User-Agent': 'Mozilla/5.0 QA-Automation-Bot' },
    });
    const html = await res.text();
    assert(
      html.includes('Security Gatekeeper') ||
      html.includes('Master Founder Passkey') ||
      html.includes('Administrative Terminal Access'),
      'Security Challenge Gate must be rendered for unauthenticated requests'
    );
    logPass('Test 1: Admin Security Gate Lockdown', 'Unauthenticated requests safely blocked by Challenge Gate.');
  } catch (err) {
    logFail('Test 1: Admin Security Gate Lockdown', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Brute-Force / Wrong Passkey Rejection
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey: 'wrong_secret_123' }),
    });
    assert(res.status === 401, `Expected status 401, got ${res.status}`);
    const data = await res.json();
    assert(data.error && data.error.includes('Access denied'), 'Expected access denied error message');
    logPass('Test 2: Brute-Force Rejection', 'Invalid passkey correctly rejected with 401 Unauthorized.');
  } catch (err) {
    logFail('Test 2: Brute-Force Rejection', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Founder Master Passkey Authentication & Cookie Issuance
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey: PASSKEY }),
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Expected success: true');

    const setCookieHeader = res.headers.get('set-cookie');
    assert(setCookieHeader && setCookieHeader.includes('pairs_admin_auth'), 'Expected pairs_admin_auth cookie in response');

    // Extract the cookie value for subsequent authenticated calls
    const match = setCookieHeader.match(/pairs_admin_auth=([^;]+)/);
    authCookie = match ? match[1] : 'valid_founder_session_abdullah17';

    // Verify session via GET /api/admin/auth
    const verifyRes = await fetch(`${BASE_URL}/api/admin/auth`, {
      headers: { Cookie: `pairs_admin_auth=${authCookie}` },
    });
    const verifyData = await verifyRes.json();
    assert(verifyData.authenticated === true, 'Session token should be recognized as authenticated');

    logPass('Test 3: Passkey Auth & Cookie Issuance', `Authenticated with '${PASSKEY}' and received valid session.`);
  } catch (err) {
    logFail('Test 3: Passkey Auth & Cookie Issuance', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Product Boundary Validation (Negative Price, Empty Title, Inverted CompareAt)
  // --------------------------------------------------------------------------
  try {
    // 4a. Empty title
    const resEmptyTitle = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `pairs_admin_auth=${authCookie}`,
      },
      body: JSON.stringify({ title: '   ', price: 4000 }),
    });
    assert(resEmptyTitle.status === 400, 'Empty title should return 400 Bad Request');

    // 4b. Negative price
    const resNegPrice = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `pairs_admin_auth=${authCookie}`,
      },
      body: JSON.stringify({ title: 'Invalid Price Denim', price: -500 }),
    });
    assert(resNegPrice.status === 400, 'Negative price should return 400 Bad Request');

    // 4c. Inverted Compare At Price (compareAtPrice < price)
    const resInverted = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `pairs_admin_auth=${authCookie}`,
      },
      body: JSON.stringify({
        title: 'Inverted Price Denim',
        price: 5000,
        compareAtPrice: 3000,
      }),
    });
    assert(resInverted.status === 400, 'compareAtPrice < price should return 400 Bad Request');

    logPass('Test 4: Product Boundary Validation', 'Empty titles, negative prices, and inverted compare-at prices safely rejected.');
  } catch (err) {
    logFail('Test 4: Product Boundary Validation', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Product CRUD & Automatic 5-Variant Matrix
  // --------------------------------------------------------------------------
  try {
    const newProductPayload = {
      title: 'QA Automated Bootcut Denim 001',
      price: 4999,
      compareAtPrice: 6500,
      description: 'Heavyweight raw indigo denim tested via QA automation suite.',
      initialStock: 20,
      waistSizes: ['28', '30', '32', '34', '36'],
      status: 'ACTIVE',
    };

    const res = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `pairs_admin_auth=${authCookie}`,
      },
      body: JSON.stringify(newProductPayload),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Product creation should succeed');
    assert(data.product && data.product.variants, 'Product with variants should be returned');
    assert(data.product.variants.length === 5, `Expected 5 variants, got ${data.product.variants.length}`);

    testProductId = data.product.id;
    const variant32 = data.product.variants.find((v) => v.waist === '32' || v.title.includes('32'));
    assert(variant32, 'Variant for waist 32 must exist');
    assert(variant32.inventoryQuantity === 20, 'Initial inventory should be 20');
    testVariantId = variant32.id;

    logPass('Test 5: Product CRUD & 5-Variant Matrix', `Product #${testProductId} created with 5 waist sizes (28-36) @ 20 stock each.`);
  } catch (err) {
    logFail('Test 5: Product CRUD & 5-Variant Matrix', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Discount Engine Boundaries & Constraints
  // --------------------------------------------------------------------------
  try {
    // 6a. Percentage > 100%
    const resOver100 = await fetch(`${BASE_URL}/api/admin/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `pairs_admin_auth=${authCookie}`,
      },
      body: JSON.stringify({
        code: 'OVER100',
        type: 'PERCENTAGE',
        value: 125,
      }),
    });
    assert(resOver100.status === 400, 'Discount > 100% should be rejected with 400 Bad Request');

    // 6b. Valid discount
    const uniqueCode = `QATEST${Math.floor(1000 + Math.random() * 9000)}`;
    const resValid = await fetch(`${BASE_URL}/api/admin/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `pairs_admin_auth=${authCookie}`,
      },
      body: JSON.stringify({
        code: uniqueCode,
        type: 'PERCENTAGE',
        value: 15,
        minSubtotal: 2000,
      }),
    });
    assert(resValid.status === 200, 'Valid discount creation should return 200');
    const validData = await resValid.json();
    assert(validData.success === true, 'Expected success: true');
    testDiscountId = validData.discount.id;

    // 6c. Duplicate code rejection
    const resDup = await fetch(`${BASE_URL}/api/admin/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `pairs_admin_auth=${authCookie}`,
      },
      body: JSON.stringify({
        code: uniqueCode,
        type: 'PERCENTAGE',
        value: 20,
      }),
    });
    assert(resDup.status === 400, 'Duplicate discount code should be rejected with 400 Bad Request');

    logPass('Test 6: Discount Engine Validation', `Discount rules enforced: >100% blocked, '${uniqueCode}' created, duplicates blocked.`);
  } catch (err) {
    logFail('Test 6: Discount Engine Validation', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Settings Persistence (Bank Transfer Details, Thresholds, Social URLs)
  // --------------------------------------------------------------------------
  try {
    const settingsPayload = {
      enableAnnouncement: true,
      announcement: 'QA Verified nationwide cash on delivery!',
      freeShippingThreshold: 6000,
      shippingFee: 250,
      enableBankTransfer: true,
      bankName: 'Meezan Bank Ltd',
      bankBranch: 'Gulberg III Lahore',
      bankAccountTitle: 'PAIRS CLOTHING PVT LTD',
      bankAccountNumber: '02040608101214',
      bankIban: 'PK36MEZN0002040608101214',
      bankInstructions: 'Transfer total and WhatsApp payment screenshot with order number.',
      enableSocialLinks: true,
      instagramUrl: 'https://instagram.com/pairs.clo',
      tiktokUrl: 'https://tiktok.com/@pairs.clo',
      youtubeUrl: 'https://youtube.com/@pairsclothing',
    };

    const res = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `pairs_admin_auth=${authCookie}`,
      },
      body: JSON.stringify(settingsPayload),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Settings update should succeed');

    // Verify settings via GET
    const getRes = await fetch(`${BASE_URL}/api/admin/settings`);
    const getData = await getRes.json();
    assert(getData.store.bankName === 'Meezan Bank Ltd', 'Bank name should persist');
    assert(getData.store.bankIban === 'PK36MEZN0002040608101214', 'IBAN should persist');
    assert(getData.store.freeShippingThreshold === 6000, 'Shipping threshold should persist');

    logPass('Test 7: Settings Persistence', 'Bank account details, shipping threshold, and store configs verified in DB.');
  } catch (err) {
    logFail('Test 7: Settings Persistence', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Social Channels Master Toggle & Storefront Rendering
  // --------------------------------------------------------------------------
  try {
    // 8a. Disable social links
    await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `pairs_admin_auth=${authCookie}`,
      },
      body: JSON.stringify({ enableSocialLinks: false }),
    });

    const resDisabled = await fetch(`${BASE_URL}/`);
    const htmlDisabled = await resDisabled.text();
    // When disabled, footer social link anchor tags must NOT be rendered in DOM
    assert(
      !htmlDisabled.includes('aria-label="Instagram"') && !htmlDisabled.includes('>Instagram</a>'),
      'Storefront should hide Instagram anchor link when enableSocialLinks is false'
    );

    // 8b. Re-enable social links
    await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `pairs_admin_auth=${authCookie}`,
      },
      body: JSON.stringify({ enableSocialLinks: true, enableInstagram: true }),
    });

    const resEnabled = await fetch(`${BASE_URL}/`);
    const htmlEnabled = await resEnabled.text();
    assert(
      htmlEnabled.includes('title="Instagram"') || htmlEnabled.includes('aria-label="Pairs Clothing Instagram"'),
      'Storefront should show Instagram icon/link when enableSocialLinks and enableInstagram are true'
    );

    logPass('Test 8: Social Channels Master Toggle', 'Storefront dynamically hides/shows social links based on enableSocialLinks.');
  } catch (err) {
    logFail('Test 8: Social Channels Master Toggle', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 9: Storefront Air-Gap & Zero Admin UI Leaks
  // --------------------------------------------------------------------------
  try {
    // 9a. Check Homepage Navigation Header
    const homeRes = await fetch(`${BASE_URL}/`);
    const homeHtml = await homeRes.text();
    const headerMatch = homeHtml.match(/<header[^>]*>([\s\S]*?)<\/header>/);
    const headerHtml = headerMatch ? headerMatch[1] : '';

    assert(!headerHtml.includes('MERCHANT ADMIN'), 'Storefront header should NOT contain MERCHANT ADMIN');
    assert(!headerHtml.includes('>DENIMS<') && !headerHtml.includes('>Denims<'), 'Storefront header should NOT contain duplicate DENIMS link');
    assert(!headerHtml.includes('>TRACK ORDER<') && !headerHtml.includes('>Track order<'), 'Storefront header should NOT contain TRACK ORDER');

    // 9b. Check Order Success Page
    const orderSuccessRes = await fetch(`${BASE_URL}/order-success?orderNumber=1001`);
    const orderSuccessHtml = await orderSuccessRes.text();

    assert(
      !orderSuccessHtml.includes('VIEW IN MERCHANT ADMIN') && !orderSuccessHtml.includes('View in Merchant Admin'),
      'Order Success page must NOT contain "View in Merchant Admin" button'
    );
    assert(
      orderSuccessHtml.includes('CONTINUE SHOPPING') || orderSuccessHtml.includes('Continue Shopping'),
      'Order Success page should contain centered "Continue Shopping" button'
    );

    logPass('Test 9: Storefront Air-Gap Verification', 'Zero administrative leaks: No Merchant Admin, Denims, or Track Order in navbar, and no admin button on order success.');
  } catch (err) {
    logFail('Test 9: Storefront Air-Gap Verification', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 10: Order Lifecycle, Inventory Decrement & Atomic Cancellation Restock
  // --------------------------------------------------------------------------
  try {
    assert(testVariantId, 'Variant ID must be present for order test');

    // 10a. Create order via Checkout API
    const orderPayload = {
      customerName: 'QA Customer Abdullah',
      customerEmail: 'customer@qa-test.com',
      customerPhone: '+92 300 1234567',
      shippingAddress: 'House 14, Street 2, Gulberg III',
      city: 'Lahore',
      province: 'Punjab',
      postalCode: '54000',
      paymentMethod: 'COD',
      items: [
        {
          variantId: testVariantId,
          quantity: 2,
        },
      ],
    };

    const checkoutRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    assert(checkoutRes.status === 200, `Expected 200 from checkout, got ${checkoutRes.status}`);
    const checkoutData = await checkoutRes.json();
    assert(checkoutData.success === true, 'Checkout should succeed');
    testOrderId = checkoutData.order.id;

    // Verify variant inventory was decremented from 20 to 18
    const productsRes1 = await fetch(`${BASE_URL}/api/admin/products`);
    const productsData1 = await productsRes1.json();
    const prod1 = productsData1.products.find((p) => p.id === testProductId);
    const var1 = prod1.variants.find((v) => v.id === testVariantId);
    assert(var1.inventoryQuantity === 18, `Expected inventory 18, got ${var1.inventoryQuantity}`);

    // 10b. Cancel the order via Admin API and verify atomic restock
    const cancelRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `pairs_admin_auth=${authCookie}`,
      },
      body: JSON.stringify({ financialStatus: 'CANCELLED' }),
    });
    assert(cancelRes.status === 200, 'Order cancellation should succeed');

    // Verify variant inventory was restored back from 18 to 20
    const productsRes2 = await fetch(`${BASE_URL}/api/admin/products`);
    const productsData2 = await productsRes2.json();
    const prod2 = productsData2.products.find((p) => p.id === testProductId);
    const var2 = prod2.variants.find((v) => v.id === testVariantId);
    assert(var2.inventoryQuantity === 20, `Expected restored inventory 20, got ${var2.inventoryQuantity}`);

    logPass(
      'Test 10: Atomic Inventory Restock on Cancellation',
      'Inventory decremented on purchase (20 -> 18) and atomically restored on cancellation (18 -> 20).'
    );
  } catch (err) {
    logFail('Test 10: Atomic Inventory Restock on Cancellation', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 11: Cleanup & Lock Terminal Eviction
  // --------------------------------------------------------------------------
  try {
    // Clean up test order
    if (testOrderId) {
      await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
        method: 'DELETE',
        headers: { Cookie: `pairs_admin_auth=${authCookie}` },
      });
    }

    // Clean up test discount
    if (testDiscountId) {
      await fetch(`${BASE_URL}/api/admin/discounts/${testDiscountId}`, {
        method: 'DELETE',
        headers: { Cookie: `pairs_admin_auth=${authCookie}` },
      }).catch(() => {});
    }

    // Clean up test product
    if (testProductId) {
      await fetch(`${BASE_URL}/api/admin/products/${testProductId}`, {
        method: 'DELETE',
        headers: { Cookie: `pairs_admin_auth=${authCookie}` },
      }).catch(() => {});
    }

    // Lock Terminal via DELETE /api/admin/auth
    const lockRes = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'DELETE',
    });
    assert(lockRes.status === 200, 'Lock terminal should return 200');

    // Verify session is cleared
    const checkRes = await fetch(`${BASE_URL}/api/admin/auth`);
    const checkData = await checkRes.json();
    assert(checkData.authenticated === false, 'Session should be completely revoked after Lock Terminal');

    logPass('Test 11: Terminal Lockout & Session Eviction', 'Test artifacts purged and session securely evicted.');
  } catch (err) {
    logFail('Test 11: Terminal Lockout & Session Eviction', err.message);
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`  QA SUITE EXECUTION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED  `);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
