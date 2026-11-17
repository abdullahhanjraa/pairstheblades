// scripts/verify_live_security_and_cards.js
const https = require('https');

function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== RUNNING LIVE VERIFICATION FOR PAIRSTHEBLADES.VERCEL.APP ===\n');

  // 1. Check Storefront Homepage
  console.log('1. Checking Storefront Homepage (https://pairstheblades.vercel.app)...');
  const home = await fetchUrl('https://pairstheblades.vercel.app');
  console.log('Status:', home.status);
  const hasTrackOrder = home.body.includes('/track') && home.body.includes('Track Order');
  console.log('Navbar includes Track Order link:', hasTrackOrder ? 'PASS [YES]' : 'FAIL [NO]');
  const hasAspect43 = home.body.includes('aspect-[4/3]');
  console.log('Product cards use refined aspect-[4/3] knife ratio:', hasAspect43 ? 'PASS [YES]' : 'FAIL [NO]');
  const hasMurkyGlow = home.body.includes('blur-xl opacity-20');
  console.log('Murky glow removed from storefront cards:', !hasMurkyGlow ? 'PASS [CLEAN LUXURY SURFACE]' : 'FAIL [STILL PRESENT]');

  // 2. Check /track page
  console.log('\n2. Checking /track page...');
  const track = await fetchUrl('https://pairstheblades.vercel.app/track');
  console.log('Track Order page status:', track.status === 200 ? 'PASS [200 OK]' : `FAIL [${track.status}]`);

  // 3. Check /admin security without session cookie
  console.log('\n3. Checking /admin Security Gate (Unauthenticated Request)...');
  const adminNoAuth = await fetchUrl('https://pairstheblades.vercel.app/admin');
  console.log('Admin route status:', adminNoAuth.status);
  const hasPasskeyForm = adminNoAuth.body.includes('Master Passkey') || adminNoAuth.body.includes('Founder Passkey') || adminNoAuth.body.includes('Authenticate Session');
  const hasMerchantDashboard = adminNoAuth.body.includes('MERCHANT OVERVIEW') || adminNoAuth.body.includes('Rs.76,995.00');
  console.log('Security Gate / Passkey Form presented to unauthorized visitor:', hasPasskeyForm ? 'PASS [YES, LOCKED]' : 'FAIL [NO]');
  console.log('Merchant Dashboard data exposed to unauthorized visitor:', hasMerchantDashboard ? 'FAIL [DATA LEAKED]' : 'PASS [SAFELY HIDDEN]');

  // 4. Check /admin/products security without session cookie
  console.log('\n4. Checking /admin/products Security Gate (Direct URL entry without cookie)...');
  const adminProductsNoAuth = await fetchUrl('https://pairstheblades.vercel.app/admin/products');
  console.log('Admin products status:', adminProductsNoAuth.status);
  const adminProductsLocked = adminProductsNoAuth.body.includes('Authenticate Session') || adminProductsNoAuth.body.includes('Master Passkey');
  const adminProductsLeaked = adminProductsNoAuth.body.includes('ADD PRODUCT') && adminProductsNoAuth.body.includes('Inventory Stock');
  console.log('Admin Products presented gate:', adminProductsLocked ? 'PASS [LOCKED]' : 'FAIL');
  console.log('Admin Products leaked without password:', adminProductsLeaked ? 'FAIL' : 'PASS [SAFELY BLOCKED]');

  console.log('\n=== VERIFICATION SUMMARY ===');
  if (hasTrackOrder && hasAspect43 && !hasMurkyGlow && track.status === 200 && hasPasskeyForm && !hasMerchantDashboard && adminProductsLocked && !adminProductsLeaked) {
    console.log('ALL AUDITS PASSED WITH ZERO SECURITY OR VISUAL DEFECTS!');
  } else {
    console.log('SOME AUDITS FAILED - INVESTIGATE');
  }
}

run().catch(err => {
  console.error('Error running QA:', err);
  process.exit(1);
});
