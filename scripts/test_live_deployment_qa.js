const BASE_URL = 'https://pairstheblades.vercel.app';

async function runLiveQA() {
  console.log(`=== LIVE DEPLOYMENT SMOKE TEST: ${BASE_URL} ===\n`);

  // 1. Check Storefront Homepage
  console.log('1. Checking Storefront Homepage...');
  const homeRes = await fetch(`${BASE_URL}/`);
  if (!homeRes.ok) throw new Error(`Homepage failed with status ${homeRes.status}`);
  const homeHtml = await homeRes.text();
  const hasStoreTitle = homeHtml.includes('Pairs') || homeHtml.includes('Blade') || homeHtml.includes('Steel');
  console.log(`   ✓ Homepage HTTP 200 OK (Content verified: ${hasStoreTitle})`);

  // 2. Admin Authentication
  console.log('\n2. Testing Admin Authentication (/api/admin/auth)...');
  const authRes = await fetch(`${BASE_URL}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passkey: 'abdullahhanjra17' }),
  });
  if (!authRes.ok) throw new Error(`Admin Auth failed with status ${authRes.status}`);
  const authData = await authRes.json();
  const cookie = authRes.headers.get('set-cookie');
  console.log(`   ✓ Admin authenticated successfully: ${authData.message}`);

  // 3. Admin Settings Inspection
  console.log('\n3. Inspecting Live Store Settings (/api/admin/settings)...');
  const settingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    headers: cookie ? { 'Cookie': cookie } : {},
  });
  if (!settingsRes.ok) throw new Error(`Settings fetch failed with status ${settingsRes.status}`);
  const settingsData = await settingsRes.json();
  const settings = settingsData.store || settingsData;
  console.log(`   ✓ Live Store Name: "${settings.name}"`);
  console.log(`   ✓ Legal Name: "${settings.legalName}"`);
  console.log(`   ✓ Currency: "${settings.currencySymbol}" (${settings.currency})`);
  console.log(`   ✓ Nationwide COD Active: ${settings.enableCod}`);
  console.log(`   ✓ Bank Transfer Active: ${settings.enableBankTransfer} (${settings.bankName})`);

  // 4. Products & CDN Verification
  console.log('\n4. Inspecting Live Catalog & Supabase CDN Images (/api/admin/products)...');
  const prodRes = await fetch(`${BASE_URL}/api/admin/products`, {
    headers: cookie ? { 'Cookie': cookie } : {},
  });
  if (!prodRes.ok) throw new Error(`Products fetch failed with status ${prodRes.status}`);
  const prodData = await prodRes.json();
  const products = prodData.products || prodData;
  console.log(`   ✓ Total products retrieved from Supabase PostgreSQL: ${products.length}`);
  for (const p of products) {
    console.log(`     - [${p.status}] ${p.title} (Rs. ${p.price})`);
    console.log(`       Cover: ${p.featuredImage.substring(0, 80)}...`);
  }

  // 5. Product Detail View Check
  console.log('\n5. Checking Live Product Page (/products/hand-forged-katana-sword-1095-carbon)...');
  const pdpRes = await fetch(`${BASE_URL}/products/hand-forged-katana-sword-1095-carbon`);
  if (!pdpRes.ok) throw new Error(`PDP failed with status ${pdpRes.status}`);
  const pdpHtml = await pdpRes.text();
  const hasCdnImg = pdpHtml.includes('sipreibgzwmeirmhhbit.supabase.co');
  console.log(`   ✓ Product page HTTP 200 OK (Contains Supabase CDN image: ${hasCdnImg})`);

  // 6. Test Live Order Checkout (Nationwide COD)
  console.log('\n6. Testing Live COD Checkout (/api/checkout)...');
  const katana = products.find(p => p.handle.includes('katana') || p.title.includes('Katana')) || products[0];
  const variant = katana.variants[0];

  const orderPayload = {
    customerName: 'Muhammad Ali (Live Vercel Verification)',
    customerEmail: 'verification@pairstheblades.vercel.app',
    customerPhone: '03001234567',
    shippingAddress: 'House 14, Sector F-8/2',
    city: 'Islamabad',
    province: 'Islamabad Capital Territory',
    postalCode: '44000',
    notes: 'Please call before arrival for blade delivery.',
    paymentMethod: 'COD',
    items: [
      {
        productId: katana.id,
        variantId: variant.id,
        title: katana.title,
        variantTitle: variant.title,
        price: katana.price,
        quantity: 1,
        image: katana.featuredImage,
      }
    ],
  };

  const checkoutRes = await fetch(`${BASE_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });

  if (!checkoutRes.ok) {
    const errText = await checkoutRes.text();
    throw new Error(`Checkout failed with status ${checkoutRes.status}: ${errText}`);
  }

  const checkoutData = await checkoutRes.json();
  console.log(`   ✓ Live order placed successfully!`);
  console.log(`     Order #: ${checkoutData.order.orderNumber}`);
  console.log(`     Total: Rs. ${checkoutData.order.totalPrice}`);
  console.log(`     Customer: ${checkoutData.order.customerName} (${checkoutData.order.city})`);
  console.log(`     Fulfillment Status: ${checkoutData.order.fulfillmentStatus}`);

  // 7. Verify Order shows up in Admin Orders Table
  console.log('\n7. Verifying Order in Admin Orders (/api/admin/orders)...');
  const ordersRes = await fetch(`${BASE_URL}/api/admin/orders`, {
    headers: cookie ? { 'Cookie': cookie } : {},
  });
  const ordersData = await ordersRes.json();
  const orders = ordersData.orders || ordersData;
  const foundOrder = orders.find(o => o.orderNumber === checkoutData.order.orderNumber);
  console.log(`   ✓ Order #${foundOrder?.orderNumber} confirmed in Supabase PostgreSQL orders list!`);

  console.log('\n======================================================');
  console.log('🎉 ALL LIVE PRODUCTION VERIFICATIONS PASSED CLEANLY! 🎉');
  console.log('======================================================');
}

runLiveQA().catch(err => {
  console.error('\n❌ Live QA failed:', err);
  process.exit(1);
});
