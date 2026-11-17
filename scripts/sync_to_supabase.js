const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const SUPABASE_URL = 'https://sipreibgzwmeirmhhbit.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IMGIm-DRK15yKAPS_rP2kQ_c7qkvvHx';
const CDN_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/product-media/products/`;

// Local SQLite client
const localPrisma = new PrismaClient();

// Supabase Postgres client
process.env.DATABASE_URL = 'postgresql://postgres.sipreibgzwmeirmhhbit:Abdullahcode%24%241@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function uploadLocalImages() {
  console.log('--- Step 1: Uploading local product images to Supabase Storage ---');
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'products');
  if (!fs.existsSync(uploadDir)) {
    console.log('No local upload directory found.');
    return;
  }

  const files = fs.readdirSync(uploadDir);
  for (const file of files) {
    const filePath = path.join(uploadDir, file);
    if (!fs.statSync(filePath).isFile()) continue;

    console.log(`Uploading ${file} ...`);
    const buffer = fs.readFileSync(filePath);
    const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/product-media/products/${file}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': mime,
        'x-upsert': 'true',
      },
      body: buffer,
    });

    if (res.ok) {
      console.log(`✓ Uploaded: ${file}`);
    } else {
      console.log(`Notice for ${file}:`, res.status, await res.text());
    }
  }
}

function remapUrl(url) {
  if (!url) return url;
  if (url.startsWith('/uploads/products/')) {
    const filename = url.replace('/uploads/products/', '');
    return `${CDN_BASE_URL}${filename}`;
  }
  return url;
}

function remapImagesJson(jsonStr) {
  if (!jsonStr) return '[]';
  try {
    const arr = JSON.parse(jsonStr);
    if (Array.isArray(arr)) {
      const remapped = arr.map(remapUrl);
      return JSON.stringify(remapped);
    }
  } catch (e) {}
  return jsonStr;
}

async function migrateData() {
  console.log('--- Step 2: Extracting data from local SQLite ---');
  const store = await localPrisma.store.findFirst();
  const discounts = await localPrisma.discount.findMany();
  const products = await localPrisma.product.findMany({
    include: { variants: true }
  });
  const orders = await localPrisma.order.findMany({
    include: { items: true }
  });

  console.log(`Found: Store "${store?.name}", ${discounts.length} discounts, ${products.length} products, ${orders.length} orders.`);

  console.log('--- Step 3: Connecting to Supabase PostgreSQL ---');
  // Dynamic import of PrismaClient pointing to postgres schema
  const { execSync } = require('child_process');

  // We can write a temporary script or use Prisma with postgres connection
  console.log('Inserting into Supabase Postgres via Prisma...');
  
  // Reconnect localPrisma
  await localPrisma.$disconnect();

  // Create Postgres client using the postgres schema
  // Note: we can generate prisma client or execute raw SQL commands to insert with full integrity!
  const targetDbUrl = 'postgresql://postgres.sipreibgzwmeirmhhbit:Abdullahcode%24%241@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';
  
  // Let's use pg client directly or raw SQL generator to guarantee 100% precision
  const { Client } = require('pg');
  const client = new Client({
    connectionString: targetDbUrl,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('✓ Connected to Supabase PostgreSQL via pg client!');

  // 1. Store
  if (store) {
    console.log('Upserting Store record...');
    const query = `
      INSERT INTO "Store" (
        "id", "name", "legalName", "handle", "logoText", "supportEmail", "supportPhone", "supportCity", "contactAddress",
        "enableAnnouncement", "announcement",
        "heroTag", "heroTitle", "heroDescription", "heroImageUrl", "heroCtaText", "heroCtaLink",
        "valueProp1", "valueProp2", "valueProp3",
        "catalogTitle", "catalogSubtitle",
        "communityTitle", "communitySubtitle", "communityLink", "communityCtaText",
        "enableSocialLinks", "enableInstagram", "enableTiktok", "enableYoutube", "enableWhatsApp", "enableFloatingWhatsApp",
        "whatsappNumber", "whatsappDefaultMsg", "instagramUrl", "tiktokUrl", "youtubeUrl",
        "currency", "currencySymbol", "freeShippingThreshold", "shippingFee", "estimatedDeliveryDays",
        "enableCod", "enableCard", "codNotice", "enableBankTransfer", "bankName", "bankAccountTitle", "bankAccountNumber", "bankIban", "bankBranch", "bankInstructions", "cardGatewayName", "cardInstructions", "cardMode",
        "policyRefund", "policyShipping", "policyTerms", "policyPrivacy", "policyContact",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11,
        $12, $13, $14, $15, $16, $17,
        $18, $19, $20,
        $21, $22,
        $23, $24, $25, $26,
        $27, $28, $29, $30, $31, $32,
        $33, $34, $35, $36, $37,
        $38, $39, $40, $41, $42,
        $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55,
        $56, $57, $58, $59, $60,
        $61, $62
      )
      ON CONFLICT ("id") DO UPDATE SET
        "name" = EXCLUDED."name",
        "legalName" = EXCLUDED."legalName",
        "handle" = EXCLUDED."handle",
        "heroTitle" = EXCLUDED."heroTitle",
        "heroDescription" = EXCLUDED."heroDescription",
        "heroImageUrl" = EXCLUDED."heroImageUrl",
        "catalogTitle" = EXCLUDED."catalogTitle",
        "catalogSubtitle" = EXCLUDED."catalogSubtitle",
        "communityTitle" = EXCLUDED."communityTitle",
        "communitySubtitle" = EXCLUDED."communitySubtitle",
        "communityLink" = EXCLUDED."communityLink",
        "instagramUrl" = EXCLUDED."instagramUrl",
        "tiktokUrl" = EXCLUDED."tiktokUrl",
        "youtubeUrl" = EXCLUDED."youtubeUrl",
        "shippingFee" = EXCLUDED."shippingFee",
        "freeShippingThreshold" = EXCLUDED."freeShippingThreshold",
        "updatedAt" = NOW();
    `;
    await client.query(query, [
      store.id, store.name, store.legalName, store.handle, store.logoText, store.supportEmail, store.supportPhone, store.supportCity, store.contactAddress,
      store.enableAnnouncement, store.announcement,
      store.heroTag, store.heroTitle, store.heroDescription, remapUrl(store.heroImageUrl), store.heroCtaText, store.heroCtaLink,
      store.valueProp1, store.valueProp2, store.valueProp3,
      store.catalogTitle, store.catalogSubtitle,
      store.communityTitle, store.communitySubtitle, store.communityLink, store.communityCtaText,
      store.enableSocialLinks, store.enableInstagram, store.enableTiktok, store.enableYoutube, store.enableWhatsApp, store.enableFloatingWhatsApp,
      store.whatsappNumber, store.whatsappDefaultMsg, store.instagramUrl, store.tiktokUrl, store.youtubeUrl,
      store.currency, store.currencySymbol, store.freeShippingThreshold, store.shippingFee, store.estimatedDeliveryDays,
      store.enableCod, store.enableCard, store.codNotice, store.enableBankTransfer, store.bankName, store.bankAccountTitle, store.bankAccountNumber, store.bankIban, store.bankBranch, store.bankInstructions, store.cardGatewayName, store.cardInstructions, store.cardMode,
      store.policyRefund, store.policyShipping, store.policyTerms, store.policyPrivacy, store.policyContact,
      store.createdAt, store.updatedAt
    ]);
    console.log(`✓ Upserted Store: ${store.name}`);
  }

  // 2. Discounts
  for (const d of discounts) {
    const q = `
      INSERT INTO "Discount" ("id", "storeId", "code", "type", "value", "minSubtotal", "status", "usageCount", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT ("id") DO NOTHING;
    `;
    await client.query(q, [d.id, d.storeId, d.code, d.type, d.value, d.minSubtotal, d.status, d.usageCount, d.createdAt, d.updatedAt]);
  }
  console.log(`✓ Synced ${discounts.length} discounts.`);

  // 3. Products & Variants
  for (const p of products) {
    const featuredImg = remapUrl(p.featuredImage);
    const imagesJson = remapImagesJson(p.images);

    const pq = `
      INSERT INTO "Product" ("id", "storeId", "title", "handle", "description", "bodyHtml", "price", "compareAtPrice", "featuredImage", "images", "status", "tags", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT ("id") DO UPDATE SET
        "title" = EXCLUDED."title",
        "handle" = EXCLUDED."handle",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "compareAtPrice" = EXCLUDED."compareAtPrice",
        "featuredImage" = EXCLUDED."featuredImage",
        "images" = EXCLUDED."images",
        "status" = EXCLUDED."status",
        "tags" = EXCLUDED."tags",
        "updatedAt" = NOW();
    `;
    await client.query(pq, [
      p.id, p.storeId, p.title, p.handle, p.description, p.bodyHtml, p.price, p.compareAtPrice, featuredImg, imagesJson, p.status, p.tags, p.createdAt, p.updatedAt
    ]);

    for (const v of p.variants) {
      const vq = `
        INSERT INTO "ProductVariant" ("id", "productId", "title", "option1", "price", "compareAtPrice", "inventoryQuantity", "sku", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT ("id") DO UPDATE SET
          "price" = EXCLUDED."price",
          "compareAtPrice" = EXCLUDED."compareAtPrice",
          "inventoryQuantity" = EXCLUDED."inventoryQuantity",
          "updatedAt" = NOW();
      `;
      await client.query(vq, [
        v.id, v.productId, v.title, v.option1, v.price, v.compareAtPrice, v.inventoryQuantity, v.sku, v.createdAt, v.updatedAt
      ]);
    }
  }
  console.log(`✓ Synced ${products.length} products and their variants.`);

  // 4. Orders & OrderItems
  for (const o of orders) {
    const oq = `
      INSERT INTO "Order" (
        "id", "storeId", "orderNumber", "customerName", "customerEmail", "customerPhone", "shippingAddress", "city", "province", "postalCode",
        "subtotalPrice", "shippingPrice", "totalPrice", "paymentMethod", "financialStatus", "fulfillmentStatus", "trackingCompany", "trackingNumber", "notes",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21
      )
      ON CONFLICT ("id") DO NOTHING;
    `;
    await client.query(oq, [
      o.id, o.storeId, o.orderNumber, o.customerName, o.customerEmail, o.customerPhone, o.shippingAddress, o.city, o.province, o.postalCode,
      o.subtotalPrice, o.shippingPrice, o.totalPrice, o.paymentMethod, o.financialStatus, o.fulfillmentStatus, o.trackingCompany, o.trackingNumber, o.notes,
      o.createdAt, o.updatedAt
    ]);

    for (const item of o.items) {
      const iq = `
        INSERT INTO "OrderItem" ("id", "orderId", "productId", "variantId", "title", "variantTitle", "price", "quantity", "image")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT ("id") DO NOTHING;
      `;
      await client.query(iq, [
        item.id, item.orderId, item.productId, item.variantId, item.title, item.variantTitle, item.price, item.quantity, remapUrl(item.image)
      ]);
    }
  }
  console.log(`✓ Synced ${orders.length} orders and their items.`);

  await client.end();
  console.log('--- ALL DATA SUCCESSFULLY MIGRATED TO SUPABASE! ---');
}

async function run() {
  await uploadLocalImages();
  await migrateData();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
