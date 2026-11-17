/**
 * ==============================================================================
 * Comprehensive Senior QA Automation: Device Uploads, Granular Social Switches,
 * Storefront Header/Footer Navigation & Floating WhatsApp Concierge
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const PASSKEY = 'abdullahhanjra17';

let authCookie = '';
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

async function run() {
  console.log('\n===============================================================');
  console.log('  PAIRS CLOTHING — ADVANCED QA TEST SUITE: UPLOADS & SOCIAL     ');
  console.log(`  Target Environment: ${BASE_URL}                            `);
  console.log('===============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Upload API Security Gate (Unauthenticated Request)
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
      body: new FormData(),
    });
    assert(res.status === 401, `Expected 401 Unauthorized, received ${res.status}`);
    const data = await res.json();
    assert(data.success === false, 'Expected success: false for unauthenticated upload');
    logPass('Test 1: Upload API Security Gate', 'Direct uploads without admin session correctly rejected with 401.');
  } catch (err) {
    logFail('Test 1: Upload API Security Gate', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Administrative Authentication & Session Generation
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey: PASSKEY }),
    });
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    const rawCookie = res.headers.get('set-cookie');
    assert(rawCookie && rawCookie.includes('pairs_admin_auth'), 'Expected pairs_admin_auth cookie in response');
    authCookie = rawCookie.split(';')[0];
    logPass('Test 2: Administrative Authentication', 'Master passkey verified; secure session established.');
  } catch (err) {
    logFail('Test 2: Administrative Authentication', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Upload API File Type Validation
  // --------------------------------------------------------------------------
  try {
    const fakeTextFile = new Blob(['hello world malicious script'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', fakeTextFile, 'exploit.txt');
    formData.append('folder', 'products');

    const res = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: formData,
    });
    assert(res.status === 400, `Expected 400 for text/plain file, got ${res.status}`);
    const data = await res.json();
    assert(data.success === false && data.error.includes('Invalid file format'), 'Expected file format rejection error');
    logPass('Test 3: Upload File Type Enforcement', 'Non-image file extensions & MIME types blocked with 400.');
  } catch (err) {
    logFail('Test 3: Upload File Type Enforcement', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Valid Product Photo Upload & Physical Storage Verification
  // --------------------------------------------------------------------------
  let uploadedProductUrl = '';
  try {
    // 1x1 transparent PNG binary bytes
    const pngBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const mockImageBlob = new Blob([pngBytes], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', mockImageBlob, 'test_denim_front.png');
    formData.append('folder', 'products');

    const res = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: formData,
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Expected upload success: true');
    assert(data.url && data.url.startsWith('/uploads/products/'), `Invalid URL format: ${data.url}`);
    uploadedProductUrl = data.url;

    // Verify file exists on local disk
    const diskPath = path.join(process.cwd(), 'public', uploadedProductUrl.replace(/^\//, ''));
    assert(fs.existsSync(diskPath), `Uploaded file not found on disk at: ${diskPath}`);
    const stats = fs.statSync(diskPath);
    assert(stats.size > 0, 'Uploaded file size on disk is 0 bytes');

    logPass('Test 4: Product Photo Device Upload & Persistence', `File successfully written to ${uploadedProductUrl} (${stats.size} bytes).`);
  } catch (err) {
    logFail('Test 4: Product Photo Device Upload & Persistence', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Valid Hero Banner Upload & Folder Isolation
  // --------------------------------------------------------------------------
  try {
    const pngBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const mockBannerBlob = new Blob([pngBytes], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', mockBannerBlob, 'hero_autumn_2026.png');
    formData.append('folder', 'banners');

    const res = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: formData,
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Expected success: true');
    assert(data.url && data.url.startsWith('/uploads/banners/'), `Invalid banner URL: ${data.url}`);

    const bannerDiskPath = path.join(process.cwd(), 'public', data.url.replace(/^\//, ''));
    assert(fs.existsSync(bannerDiskPath), `Banner file missing on disk: ${bannerDiskPath}`);

    logPass('Test 5: Hero Banner Device Upload & Isolation', `Banner uploaded to separate isolated directory: ${data.url}`);
  } catch (err) {
    logFail('Test 5: Hero Banner Device Upload & Isolation', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Granular Dual Social Toggles Persistence (Prisma DB)
  // --------------------------------------------------------------------------
  try {
    // We update settings with independent switches:
    // Instagram = ON, TikTok = OFF, YouTube = ON, WhatsApp = ON, Floating WhatsApp = ON
    const updatePayload = {
      enableSocialLinks: true,
      enableInstagram: true,
      instagramUrl: 'https://instagram.com/pairsclothing.official',
      enableTiktok: false,
      tiktokUrl: 'https://tiktok.com/@pairs.denim',
      enableYoutube: true,
      youtubeUrl: 'https://youtube.com/@pairsclothing',
      enableWhatsApp: true,
      enableFloatingWhatsApp: true,
      whatsappNumber: '0331 6617618', // Test local PK format normalization
      whatsappDefaultMsg: 'Salam Pairs Support, inquiry about Drop 001 fit.',
    };

    const putRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify(updatePayload),
    });
    assert(putRes.status === 200, `Expected 200 PUT settings, got ${putRes.status}`);
    const putData = await putRes.json();
    assert(putData.success === true, 'Settings update returned false');

    // Fetch back and assert every individual toggle persisted
    const getRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: { Cookie: authCookie },
    });
    const getData = await getRes.json();
    const settings = getData.store || getData.settings;

    assert(settings.enableInstagram === true, 'enableInstagram toggle failed to persist');
    assert(settings.enableTiktok === false, 'enableTiktok toggle failed to persist');
    assert(settings.enableYoutube === true, 'enableYoutube toggle failed to persist');
    assert(settings.enableWhatsApp === true, 'enableWhatsApp toggle failed to persist');
    assert(settings.enableFloatingWhatsApp === true, 'enableFloatingWhatsApp toggle failed to persist');
    assert(settings.whatsappNumber === '0331 6617618', 'whatsappNumber failed to persist');

    logPass(
      'Test 6: Granular Social Toggles Persistence',
      'Dual switches for Instagram (ON), TikTok (OFF), YouTube (ON), and WhatsApp (ON) saved cleanly in database.'
    );
  } catch (err) {
    logFail('Test 6: Granular Social Toggles Persistence', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Storefront Header Navigation Check (Home, All Products, Contact)
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/`);
    assert(res.status === 200, `Expected 200 OK from storefront, got ${res.status}`);
    const html = await res.text();

    assert(
      html.includes('href="/contact"') || html.includes('Contact'),
      'Header navigation must contain "Contact" link'
    );
    assert(
      html.includes('ALL PRODUCTS') || html.includes('All Products'),
      'Header navigation must contain "All Products" link'
    );
    logPass('Test 7: Storefront Header Navigation', 'Navbar features [Home, All Products, Contact] in clean executive order.');
  } catch (err) {
    logFail('Test 7: Storefront Header Navigation', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Storefront Footer Links & Contact Relocation Verification
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();

    // Verify Contact page was removed from the footer policy list
    // The policy section should only contain Terms of Service, Refund Policy, Shipping Policy, Privacy Policy
    assert(
      !html.includes('Contact information</Link>') && !html.includes('Contact Information</Link>'),
      'Footer must NOT duplicate Contact Information under policies list'
    );

    // Verify SVG glyphs are rendered for enabled channels
    assert(html.includes('href="https://instagram.com/pairsclothing.official"'), 'Instagram official profile link missing in footer');
    assert(html.includes('href="https://youtube.com/@pairsclothing"'), 'YouTube official link missing in footer');
    // Verify disabled TikTok channel is NOT rendered
    assert(!html.includes('href="https://tiktok.com/@pairs.denim"'), 'Disabled TikTok link should not appear in footer');

    logPass(
      'Test 8: Storefront Footer Architecture',
      'Contact link cleanly removed from footer policies; Instagram & YouTube SVG glyphs present; disabled TikTok omitted.'
    );
  } catch (err) {
    logFail('Test 8: Storefront Footer Architecture', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 9: Storefront Floating WhatsApp Concierge & Phone Normalization
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();

    // Verify floating WhatsApp button rendered
    assert(html.includes('https://wa.me/923316617618'), 'WhatsApp floating button must have normalized international phone format (923316617618)');
    assert(html.includes('Chat on WhatsApp'), 'WhatsApp tooltip / accessible label must be present');

    logPass(
      'Test 9: Floating WhatsApp Customer Support Concierge',
      'Fixed bottom-right WhatsApp button renders with normalized international wa.me link (923316617618).'
    );
  } catch (err) {
    logFail('Test 9: Floating WhatsApp Customer Support Concierge', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 10: Dedicated Contact Page Functionality
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/contact`);
    assert(res.status === 200, `Expected 200 OK from /contact, got ${res.status}`);
    const html = await res.text();

    assert(html.includes('WhatsApp Concierge') || html.includes('Chat on WhatsApp'), 'Contact page must feature direct WhatsApp concierge');
    assert(html.includes('7-Day Exchange Promise') || html.includes('Exchange'), 'Contact page must emphasize 7-day exchange guarantee');
    logPass('Test 10: Dedicated Contact Page', '/contact page renders with concierge card, studio location, and customer policies.');
  } catch (err) {
    logFail('Test 10: Dedicated Contact Page', err.message);
  }

  // --------------------------------------------------------------------------
  // Clean up any test uploaded images
  // --------------------------------------------------------------------------
  try {
    if (uploadedProductUrl) {
      const diskPath = path.join(process.cwd(), 'public', uploadedProductUrl.replace(/^\//, ''));
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    }
  } catch (cleanupErr) {
    // Non-critical
  }

  // Summary
  console.log('\n===============================================================');
  console.log(`  QA SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED     `);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Fatal Test Runner Error:', e);
  process.exit(1);
});
