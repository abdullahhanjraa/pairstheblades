const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const targetDbUrl = 'postgresql://postgres.sipreibgzwmeirmhhbit:Abdullahcode%24%241@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function importData() {
  const raw = fs.readFileSync(path.join(__dirname, 'exported_data.json'), 'utf8');
  const data = JSON.parse(raw);

  const client = new Client({
    connectionString: targetDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✓ Connected to Supabase PostgreSQL');

  // 1. Stores
  for (const s of data.stores) {
    // Convert boolean integers from sqlite (0/1) to actual booleans for postgres
    const cols = Object.keys(s);
    const booleanCols = [
      'enableAnnouncement', 'enableSocialLinks', 'enableInstagram', 'enableTiktok',
      'enableYoutube', 'enableWhatsApp', 'enableFloatingWhatsApp',
      'enableCod', 'enableCard', 'enableBankTransfer'
    ];
    for (const b of booleanCols) {
      if (s[b] !== undefined && s[b] !== null) {
        s[b] = Boolean(s[b]);
      }
    }
    // Convert timestamp integers or strings to Date objects
    if (s.createdAt) s.createdAt = new Date(s.createdAt);
    if (s.updatedAt) s.updatedAt = new Date(s.updatedAt);

    const keys = Object.keys(s);
    const colNames = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => s[k]);

    const updateSet = keys
      .filter(k => k !== 'id' && k !== 'createdAt')
      .map(k => `"${k}" = EXCLUDED."${k}"`)
      .join(', ');

    const sql = `
      INSERT INTO "Store" (${colNames})
      VALUES (${placeholders})
      ON CONFLICT ("id") DO UPDATE SET ${updateSet};
    `;

    await client.query(sql, values);
    console.log(`✓ Seeded Store: ${s.name}`);
  }

  // 2. Discounts
  for (const d of data.discounts) {
    if (d.createdAt) d.createdAt = new Date(d.createdAt);
    if (d.updatedAt) d.updatedAt = new Date(d.updatedAt);

    const keys = Object.keys(d);
    const colNames = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => d[k]);

    const sql = `
      INSERT INTO "Discount" (${colNames})
      VALUES (${placeholders})
      ON CONFLICT ("id") DO NOTHING;
    `;
    await client.query(sql, values);
  }
  console.log(`✓ Seeded ${data.discounts.length} discounts`);

  // 3. Products
  for (const p of data.products) {
    if (p.createdAt) p.createdAt = new Date(p.createdAt);
    if (p.updatedAt) p.updatedAt = new Date(p.updatedAt);

    const keys = Object.keys(p);
    const colNames = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => p[k]);

    const updateSet = keys
      .filter(k => k !== 'id' && k !== 'createdAt')
      .map(k => `"${k}" = EXCLUDED."${k}"`)
      .join(', ');

    const sql = `
      INSERT INTO "Product" (${colNames})
      VALUES (${placeholders})
      ON CONFLICT ("id") DO UPDATE SET ${updateSet};
    `;
    await client.query(sql, values);
    console.log(`✓ Seeded Product: ${p.title}`);
  }

  // 4. Product Variants
  for (const v of data.variants) {
    if (v.createdAt) v.createdAt = new Date(v.createdAt);
    if (v.updatedAt) v.updatedAt = new Date(v.updatedAt);

    const keys = Object.keys(v);
    const colNames = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => v[k]);

    const updateSet = keys
      .filter(k => k !== 'id' && k !== 'createdAt')
      .map(k => `"${k}" = EXCLUDED."${k}"`)
      .join(', ');

    const sql = `
      INSERT INTO "ProductVariant" (${colNames})
      VALUES (${placeholders})
      ON CONFLICT ("id") DO UPDATE SET ${updateSet};
    `;
    await client.query(sql, values);
  }
  console.log(`✓ Seeded ${data.variants.length} product variants`);

  // 5. Orders
  for (const o of data.orders) {
    if (o.createdAt) o.createdAt = new Date(o.createdAt);
    if (o.updatedAt) o.updatedAt = new Date(o.updatedAt);

    const keys = Object.keys(o);
    const colNames = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => o[k]);

    const sql = `
      INSERT INTO "Order" (${colNames})
      VALUES (${placeholders})
      ON CONFLICT ("id") DO NOTHING;
    `;
    await client.query(sql, values);
  }
  console.log(`✓ Seeded ${data.orders.length} orders`);

  // 6. Order Items
  for (const oi of data.order_items) {
    const keys = Object.keys(oi);
    const colNames = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => oi[k]);

    const sql = `
      INSERT INTO "OrderItem" (${colNames})
      VALUES (${placeholders})
      ON CONFLICT ("id") DO NOTHING;
    `;
    await client.query(sql, values);
  }
  console.log(`✓ Seeded ${data.order_items.length} order items`);

  await client.end();
  console.log('--- ALL RECORDS SUCCESSFULLY IMPORTED TO SUPABASE POSTGRESQL! ---');
}

importData().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
