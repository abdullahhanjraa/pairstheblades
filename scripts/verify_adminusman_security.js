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
  console.log('=== RUNNING LIVE VERIFICATION FOR /adminusman RELOCATION & /admin 404 CLOAKING ===\n');

  // 1. Check old /admin (Must return 404 Page Not Found)
  console.log('1. Testing old /admin URL...');
  const oldAdmin = await fetchUrl('https://pairstheblades.vercel.app/admin', {}, false);
  console.log('Status:', oldAdmin.status);
  const isOldAdmin404 = oldAdmin.status === 404;
  console.log('Old /admin returns 404 Not Found:', isOldAdmin404 ? 'PASS [YES, 404 NOT FOUND]' : `FAIL [Status: ${oldAdmin.status}]`);

  // 2. Check old /admin/products (Must return 404 Page Not Found)
  console.log('\n2. Testing old /admin/products URL...');
  const oldAdminProducts = await fetchUrl('https://pairstheblades.vercel.app/admin/products', {}, false);
  console.log('Status:', oldAdminProducts.status);
  const isOldProducts404 = oldAdminProducts.status === 404;
  console.log('Old /admin/products returns 404 Not Found:', isOldProducts404 ? 'PASS [YES, 404 NOT FOUND]' : `FAIL [Status: ${oldAdminProducts.status}]`);

  // 3. Check new secret /adminusman URL without cookie (Must 307 Redirect to /adminusman/login)
  console.log('\n3. Testing secret /adminusman URL (Unauthenticated)...');
  const newAdmin = await fetchUrl('https://pairstheblades.vercel.app/adminusman', {}, false);
  console.log('Status:', newAdmin.status);
  console.log('Redirect Location:', newAdmin.headers.location);
  const isNewAdminRedirected = (newAdmin.status === 307 || newAdmin.status === 302) && newAdmin.headers.location?.includes('/adminusman/login');
  console.log('Secret /adminusman redirects to /adminusman/login:', isNewAdminRedirected ? 'PASS [YES, 307 REDIRECT]' : 'FAIL');

  // 4. Check /adminusman/login
  console.log('\n4. Testing /adminusman/login gate...');
  const loginGate = await fetchUrl('https://pairstheblades.vercel.app/adminusman/login', {}, false);
  console.log('Login gate status:', loginGate.status);
  const hasPasskeyGate = loginGate.body.includes('Master Founder Passkey') || loginGate.body.includes('Unlock Admin Terminal');
  const hasSecretLeak = loginGate.body.includes('76,995') || loginGate.body.includes('MERCHANT OVERVIEW');
  console.log('Login gate presents passkey input:', hasPasskeyGate ? 'PASS [YES]' : 'FAIL');
  console.log('Login gate leaks any orders or revenue data:', hasSecretLeak ? 'FAIL [LEAKED]' : 'PASS [ZERO LEAKS]');

  // 5. Check API security (/api/admin/orders)
  console.log('\n5. Testing API security (/api/admin/orders)...');
  const apiOrders = await fetchUrl('https://pairstheblades.vercel.app/api/admin/orders', {}, false);
  console.log('API orders status:', apiOrders.status);
  const isApiBlocked = apiOrders.status === 401;
  console.log('Internal orders API blocks unauthenticated calls:', isApiBlocked ? 'PASS [401 UNAUTHORIZED]' : 'FAIL');

  // 6. Check Public Checkout Settings API (/api/admin/settings)
  console.log('\n6. Testing public checkout settings API (/api/admin/settings)...');
  const publicSettings = await fetchUrl('https://pairstheblades.vercel.app/api/admin/settings', {}, false);
  console.log('Public settings status:', publicSettings.status);
  const isPublicSettingsWorking = publicSettings.status === 200;
  console.log('Public settings API accessible for checkout:', isPublicSettingsWorking ? 'PASS [200 OK]' : 'FAIL');

  console.log('\n=== FINAL SUMMARY ===');
  if (isOldAdmin404 && isOldProducts404 && isNewAdminRedirected && hasPasskeyGate && !hasSecretLeak && isApiBlocked && isPublicSettingsWorking) {
    console.log('ALL 6 QA CHECKS PASSED PERFECTLY!');
  } else {
    console.log('SOME CHECKS FAILED - REVIEW LOG');
  }
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
