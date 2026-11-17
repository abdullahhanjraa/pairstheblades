const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function runQA() {
  console.log('--- STARTING ADMIN SAVING & UN-SLOP QA TEST ---');
  let failures = 0;

  // TEST 1: Test POST /api/admin/settings persistence
  try {
    console.log('\n[TEST 1] Testing POST /api/admin/settings persistence...');
    const testTag = `Forged Precision ${Date.now().toString().slice(-4)}`;
    const res = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/settings',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Pairs Knife & Sword Co.',
        heroTag: testTag,
        enableInstagram: true,
        enableYoutube: true,
        enableTiktok: true,
        enableWhatsApp: true,
        heroImageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1200&auto=format&fit=crop',
      }
    );

    if (res.status === 200 && res.data.success) {
      const dbStore = await prisma.store.findFirst();
      if (dbStore && dbStore.heroTag === testTag && dbStore.enableInstagram === true) {
        console.log('✓ PASS: Settings successfully saved and verified directly in SQLite DB.');
      } else {
        console.error('✗ FAIL: DB record does not match saved data:', dbStore);
        failures++;
      }
    } else {
      console.error('✗ FAIL: API responded with status', res.status, res.data);
      failures++;
    }
  } catch (err) {
    console.error('✗ FAIL in Test 1:', err.message);
    failures++;
  }

  // TEST 2: Test PATCH /api/admin/products/[id] with Stock
  try {
    console.log('\n[TEST 2] Testing PATCH /api/admin/products/[id] with stock persistence...');
    const firstProduct = await prisma.product.findFirst({ include: { variants: true } });
    if (!firstProduct) {
      console.error('✗ FAIL: No products in DB to test.');
      failures++;
    } else {
      const targetStock = 47;
      const res = await request(
        {
          hostname: 'localhost',
          port: 3000,
          path: `/api/admin/products/${firstProduct.id}`,
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        },
        {
          title: firstProduct.title,
          stock: targetStock,
        }
      );

      if (res.status === 200 && res.data.success) {
        const checkVariant = await prisma.productVariant.findFirst({
          where: { productId: firstProduct.id },
        });
        if (checkVariant && checkVariant.inventoryQuantity === targetStock) {
          console.log(`✓ PASS: Product stock updated to ${targetStock} and verified in DB.`);
        } else {
          console.error('✗ FAIL: DB variant stock did not match:', checkVariant);
          failures++;
        }
      } else {
        console.error('✗ FAIL: Product PATCH responded with', res.status, res.data);
        failures++;
      }
    }
  } catch (err) {
    console.error('✗ FAIL in Test 2:', err.message);
    failures++;
  }

  // TEST 3: Test PATCH /api/admin/variants/[id]
  try {
    console.log('\n[TEST 3] Testing inline variant stock edit PATCH /api/admin/variants/[id]...');
    const firstVariant = await prisma.productVariant.findFirst();
    if (!firstVariant) {
      console.error('✗ FAIL: No variant in DB.');
      failures++;
    } else {
      const targetStock = 38;
      const res = await request(
        {
          hostname: 'localhost',
          port: 3000,
          path: `/api/admin/variants/${firstVariant.id}`,
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        },
        {
          inventoryQuantity: targetStock,
        }
      );

      if (res.status === 200 && res.data.success) {
        const check = await prisma.productVariant.findUnique({
          where: { id: firstVariant.id },
        });
        if (check && check.inventoryQuantity === targetStock) {
          console.log(`✓ PASS: Variant stock updated to ${targetStock} and verified in DB.`);
        } else {
          console.error('✗ FAIL: Variant stock did not update in DB.');
          failures++;
        }
      } else {
        console.error('✗ FAIL: Variant PATCH responded with', res.status, res.data);
        failures++;
      }
    }
  } catch (err) {
    console.error('✗ FAIL in Test 3:', err.message);
    failures++;
  }

  console.log(`\n--- QA SUITE FINISHED WITH ${failures} FAILURES ---`);
  await prisma.$disconnect();
  process.exit(failures > 0 ? 1 : 0);
}

runQA();
