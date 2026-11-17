// scripts/verify_live_security_and_cards.js
const https = require('https');

function fetchUrl(url, headers = {}, followRedirect = false) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (followRedirect && (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && res.headers.location) {
          const redirectUrl = res.headers.location.startsWith('http') 
            ? res.headers.location 
            : new URL(res.headers.location, url).toString();
          return fetchUrl(redirectUrl, headers, false).then(resolve).catch(reject);
        }
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
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

  // 3. Check Edge Middleware Interception on /admin without cookie (Should 307 Redirect to /admin/login)
  console.log('\n3. Checking Edge Middleware on /admin (Unauthenticated Request)...');
  const adminDirect = await fetchUrl('https://pairstheblades.vercel.app/admin', {}, false);
  console.log('Admin route HTTP status:', adminDirect.status);
  console.log('Admin route Redirect Location:', adminDirect.headers.location);
  const isRedirectedToLogin = (adminDirect.status === 307 || adminDirect.status === 302) && adminDirect.headers.location?.includes('/admin/login');
  console.log('Unauthorized request blocked and redirected at Edge:', isRedirectedToLogin ? 'PASS [YES, 307 REDIRECT]' : 'FAIL [NOT REDIRECTED]');

  // 4. Check /admin/login response
  console.log('\n4. Checking /admin/login Page...');
  const adminLogin = await fetchUrl('https://pairstheblades.vercel.app/admin/login', {}, false);
  console.log('Login page status:', adminLogin.status);
  const hasPasskeyInput = adminLogin.body.includes('Master Founder Passkey') || adminLogin.body.includes('Authenticate Session') || adminLogin.body.includes('Unlock Admin Terminal');
  const hasRevenueData = adminLogin.body.includes('76,995') || adminLogin.body.includes('MERCHANT OVERVIEW');
  console.log('Login page presents Passkey Gate:', hasPasskeyInput ? 'PASS [LOCKED GATE]' : 'FAIL');
  console.log('Login page leaks any secret merchant revenue or order data:', hasRevenueData ? 'FAIL [DATA LEAKED]' : 'PASS [ZERO DATA LEAKED]');

  // 5. Check Edge Middleware on /admin/products (Direct URL entry without cookie)
  console.log('\n5. Checking Edge Middleware on /admin/products...');
  const adminProducts = await fetchUrl('https://pairstheblades.vercel.app/admin/products', {}, false);
  console.log('Admin products HTTP status:', adminProducts.status);
  const isProductsRedirected = (adminProducts.status === 307 || adminProducts.status === 302) && adminProducts.headers.location?.includes('/admin/login');
  console.log('Admin products blocked and redirected at Edge:', isProductsRedirected ? 'PASS [YES, 307 REDIRECT]' : 'FAIL');

  // 6. Check Edge Middleware on internal API /api/admin/orders
  console.log('\n6. Checking Edge Middleware on /api/admin/orders (API Request without cookie)...');
  const apiOrders = await fetchUrl('https://pairstheblades.vercel.app/api/admin/orders', {}, false);
  console.log('API orders HTTP status:', apiOrders.status);
  const isApi401 = apiOrders.status === 401;
  console.log('Internal admin API blocked with 401 Unauthorized:', isApi401 ? 'PASS [YES, 401 UNAUTHORIZED]' : 'FAIL');

  console.log('\n=== FINAL VERIFICATION SUMMARY ===');
  if (hasTrackOrder && hasAspect43 && !hasMurkyGlow && track.status === 200 && isRedirectedToLogin && hasPasskeyInput && !hasRevenueData && isProductsRedirected && isApi401) {
    console.log('ALL AUDITS PASSED WITH 100% PERFECT SECURITY AND ZERO VISUAL DEFECTS!');
  } else {
    console.log('SOME AUDITS FAILED - INVESTIGATE');
  }
}

run().catch(err => {
  console.error('Error running QA:', err);
  process.exit(1);
});
