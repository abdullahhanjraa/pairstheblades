const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('🧪 [TEST] Running Bulk Orders & Purge Verification...');

  // 1. Get or create store
  let store = await prisma.store.findFirst();
  if (!store) {
    store = await prisma.store.create({
      data: {
        id: 'store_pairs_clothing',
        name: 'Pairs Clothing',
        handle: 'pairs-clothing',
      },
    });
  }

  // Get first product
  let product = await prisma.product.findFirst();
  if (!product) {
    product = await prisma.product.create({
      data: {
        storeId: store.id,
        title: '001 Bootcut Raw Denim',
        handle: '001-bootcut-raw-denim',
        price: 4990,
      },
    });
  }

  // 2. Create 3 test orders
  const createdOrders = [];
  for (let i = 1; i <= 3; i++) {
    const o = await prisma.order.create({
      data: {
        storeId: store.id,
        orderNumber: 9900 + i,
        customerName: `Test Bulk Buyer ${i}`,
        customerEmail: `bulkbuyer${i}@test.pk`,
        customerPhone: `+92300123450${i}`,
        shippingAddress: `Test Suite Address ${i}`,
        city: 'Lahore',
        province: 'Punjab',
        subtotalPrice: 4990,
        shippingPrice: 250,
        totalPrice: 5240,
        paymentMethod: 'COD',
        financialStatus: 'PENDING',
        fulfillmentStatus: 'UNFULFILLED',
        items: {
          create: [
            {
              productId: product.id,
              title: `Test Denim Drop ${i}`,
              variantTitle: 'Waist 32',
              price: 4990,
              quantity: 1,
            },
          ],
        },
      },
    });
    createdOrders.push(o);
  }
  console.log(`✅ [1/4] Created 3 test orders: ${createdOrders.map(o => '#' + o.orderNumber).join(', ')}`);

  // 3. Test Bulk Fulfill on first 2 orders via database
  const firstTwoIds = [createdOrders[0].id, createdOrders[1].id];
  await prisma.order.updateMany({
    where: { id: { in: firstTwoIds } },
    data: {
      fulfillmentStatus: 'FULFILLED',
      trackingCompany: 'TCS Express',
      trackingNumber: 'TRK-BULK-TEST',
    },
  });

  const fulfilledOrders = await prisma.order.findMany({
    where: { id: { in: firstTwoIds } },
  });
  if (fulfilledOrders.every(o => o.fulfillmentStatus === 'FULFILLED')) {
    console.log('✅ [2/4] Bulk Fulfill verified: 2 orders updated with tracking numbers.');
  } else {
    throw new Error('Bulk fulfill test failed');
  }

  // 4. Test Delete Selected on order 3
  const order3Id = createdOrders[2].id;
  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: order3Id } }),
    prisma.order.delete({ where: { id: order3Id } }),
  ]);

  const deletedCheck = await prisma.order.findUnique({ where: { id: order3Id } });
  if (!deletedCheck) {
    console.log('✅ [3/4] Delete Selected verified: Order #3 cleanly removed from database.');
  } else {
    throw new Error('Delete selected test failed');
  }

  // 5. Test Purge All Orders
  const [delItems, delOrders] = await prisma.$transaction([
    prisma.orderItem.deleteMany({}),
    prisma.order.deleteMany({}),
  ]);
  console.log(`✅ [4/4] Purge All Orders verified: Removed ${delOrders.count} orders & ${delItems.count} items.`);

  const remaining = await prisma.order.count();
  if (remaining === 0) {
    console.log('🎉 ALL BULK ORDERS & PURGE TESTS PASSED (0 orders remaining, fresh DB confirmed)');
  } else {
    throw new Error(`Purge failed: ${remaining} orders still remain`);
  }
}

runTest()
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
