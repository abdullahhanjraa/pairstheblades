// scripts/test_knife_catalog_qa.js
const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          json: () => {
            try {
              return JSON.parse(data);
            } catch (e) {
              return null;
            }
          },
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runQA() {
  console.log('--- STARTING KNIFE & CUTLERY STORE QA TEST SUITE ---');
  let failures = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      failures++;
    } else {
      console.log(`✅ PASSED: ${message}`);
    }
  }

  // 1. Check Storefront Home
  console.log('\n[1] Testing Storefront Home Page (/)');
  const homeRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
  });
  assert(homeRes.statusCode === 200, `Home page status is 200 (Got ${homeRes.statusCode})`);
  assert(homeRes.data.includes('Damascus Steel Chef Knife') || homeRes.data.includes('Pairs Blades'), 'Home page renders knife store products');
  assert(!homeRes.data.includes('Select Waist'), 'Home page does not contain "Select Waist" popovers');

  // 2. Check Collection Page
  console.log('\n[2] Testing Collection Page (/collections/all)');
  const colRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/collections/all',
    method: 'GET',
  });
  assert(colRes.statusCode === 200, `Collection page status is 200 (Got ${colRes.statusCode})`);
  assert(!colRes.data.includes('Waist:'), 'Collection page does not render waist filter strip');
  assert(colRes.data.includes('ALL PRODUCTS'), 'Collection page renders ALL PRODUCTS heading');

  // 3. Check Product Detail Page
  console.log('\n[3] Testing Product Detail View (/products/damascus-steel-chef-knife-8)');
  const prodRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/products/damascus-steel-chef-knife-8',
    method: 'GET',
  });
  assert(prodRes.statusCode === 200, `Product detail status is 200 (Got ${prodRes.statusCode})`);
  assert(!prodRes.data.includes('Waist Size:'), 'Product detail page does not contain "Waist Size:"');
  assert(!prodRes.data.includes('Size Guide'), 'Product detail page does not contain denim "Size Guide" button');
  assert(prodRes.data.includes('In stock, ready to dispatch'), 'Product detail displays clean stock availability');

  // 4. Admin API - List Products
  console.log('\n[4] Testing Admin Products API');
  const adminCookie = 'pairs_admin_auth=valid_founder_session_abdullah17';
  const listRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/products',
    method: 'GET',
    headers: {
      Cookie: adminCookie,
    },
  });
  assert(listRes.statusCode === 200, `Admin products API returned 200 (Got ${listRes.statusCode})`);
  const listJson = listRes.json();
  const products = listJson?.products || listJson;
  assert(Array.isArray(products) && products.length >= 5, `Found ${products ? products.length : 0} products in catalog`);
  
  let anyWaistVariant = false;
  for (const p of products) {
    for (const v of p.variants) {
      if ((v.title && v.title.toLowerCase().includes('waist')) || (v.option1 && ['28', '30', '32', '34', '36'].includes(v.option1))) {
        anyWaistVariant = true;
      }
    }
  }
  assert(!anyWaistVariant, 'No products have hardcoded waist variants');

  // 5. Admin API - Create New Manual Knife Product
  console.log('\n[5] Testing Admin Product Creation (Single Stock Pool, No Waist)');
  const createPayload = {
    title: 'Damascus Steel Hunting Cleaver',
    price: 9999,
    compareAtPrice: 12000,
    description: 'Forged 5160 carbon steel heavy duty outdoor meat and wood cleaver. Custom micarta handle.',
    featuredImage: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1200&auto=format&fit=crop',
    ],
    initialStock: 35,
    status: 'ACTIVE',
  };

  const createRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
    },
    createPayload
  );

  assert(createRes.statusCode === 200 || createRes.statusCode === 201, `Product creation returned success (Got ${createRes.statusCode})`);
  const createJson = createRes.json();
  const created = createJson?.product || createJson;
  assert(created && created.id, 'New product created with ID: ' + (created && created.id));
  assert(created.variants.length === 1, `Created product has exactly 1 inventory variant (Got ${created.variants.length})`);
  assert(created.variants[0].inventoryQuantity === 35, `Inventory quantity matches 35 units (Got ${created.variants[0].inventoryQuantity})`);
  assert(created.variants[0].option1 === 'Standard', `Variant option is Standard (Got ${created.variants[0].option1})`);

  // 6. Checkout Flow - Place an Order for a Knife
  console.log('\n[6] Testing Storefront Checkout API');
  const targetProduct = products[0];
  const targetVariant = targetProduct.variants[0];
  const initialStock = targetVariant.inventoryQuantity;

  const checkoutPayload = {
    customerName: 'Zubair Ahmed',
    customerPhone: '03211234567',
    customerEmail: 'zubair.ahmed@example.com',
    shippingAddress: 'Apartment 4B, Clifton Block 5',
    city: 'Karachi',
    province: 'Sindh',
    postalCode: '75600',
    deliveryNotes: 'Please call before arrival',
    paymentMethod: 'COD',
    items: [
      {
        productId: targetProduct.id,
        variantId: targetVariant.id,
        title: targetProduct.title,
        price: targetVariant.price,
        quantity: 2,
        image: targetProduct.featuredImage,
      },
    ],
  };

  const checkoutRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/checkout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    checkoutPayload
  );

  assert(checkoutRes.statusCode === 200 || checkoutRes.statusCode === 201, `Checkout returned success (Got ${checkoutRes.statusCode})`);
  const orderData = checkoutRes.json();
  assert(orderData && orderData.success, 'Checkout response indicated success');
  assert(orderData.order && orderData.order.orderNumber, `Generated Order #${orderData.order ? orderData.order.orderNumber : 'N/A'}`);
  
  // Verify order item in Admin Orders API has no "Waist"
  const adminOrdersRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/orders',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const ordersJson = adminOrdersRes.json();
  const createdOrder = ordersJson?.orders?.find((o) => o.id === orderData.order.id);
  const orderedItem = createdOrder?.items?.[0];
  assert(
    !orderedItem?.variantTitle || !orderedItem.variantTitle.toLowerCase().includes('waist'),
    `Order item variant title does not include "Waist" (Got: "${orderedItem ? orderedItem.variantTitle : 'null'}")`
  );

  // 7. Verify Inventory Reduction
  console.log('\n[7] Verifying Inventory Deducted Correctly');
  const checkStockRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/admin/products`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const checkJson = checkStockRes.json();
  const updatedProducts = checkJson?.products || checkJson;
  const updatedTarget = updatedProducts.find((p) => p.id === targetProduct.id);
  const updatedVariant = updatedTarget.variants.find((v) => v.id === targetVariant.id);
  assert(
    updatedVariant.inventoryQuantity === initialStock - 2,
    `Stock properly decremented from ${initialStock} to ${updatedVariant.inventoryQuantity}`
  );

  console.log('\n------------------------------------------------');
  if (failures === 0) {
    console.log('🎉 ALL TESTS PASSED WITH ZERO ERRORS!');
  } else {
    console.error(`⚠️ ${failures} TEST(S) FAILED!`);
    process.exit(1);
  }
}

runQA().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
