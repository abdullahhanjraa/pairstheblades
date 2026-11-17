const { Client } = require('pg');
const d = require('./exported_data.json');

async function insertKatana() {
  const client = new Client({
    connectionString: 'postgresql://postgres.sipreibgzwmeirmhhbit:Abdullahcode%24%241@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const p = d.products.find(x => x.title.includes('Katana'));
  if (p.createdAt) p.createdAt = new Date(p.createdAt);
  if (p.updatedAt) p.updatedAt = new Date(p.updatedAt);

  const keys = Object.keys(p);
  const colNames = keys.map(k => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => p[k]);

  try {
    await client.query(`INSERT INTO "Product" (${colNames}) VALUES (${placeholders})`, values);
    console.log('✓ Successfully inserted Katana!');
  } catch (e) {
    console.error('Insert error:', e.message);
  }

  // Also check its variant
  const v = d.variants.find(x => x.productId === p.id);
  if (v) {
    if (v.createdAt) v.createdAt = new Date(v.createdAt);
    if (v.updatedAt) v.updatedAt = new Date(v.updatedAt);
    const vkeys = Object.keys(v);
    const vColNames = vkeys.map(k => `"${k}"`).join(', ');
    const vPlaceholders = vkeys.map((_, i) => `$${i + 1}`).join(', ');
    const vValues = vkeys.map(k => v[k]);
    try {
      await client.query(`INSERT INTO "ProductVariant" (${vColNames}) VALUES (${vPlaceholders}) ON CONFLICT ("id") DO NOTHING`, vValues);
      console.log('✓ Successfully inserted Katana variant!');
    } catch (e) {
      console.error('Variant insert error:', e.message);
    }
  }

  await client.end();
}

insertKatana();
