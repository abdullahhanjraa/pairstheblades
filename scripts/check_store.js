const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const s = await prisma.store.findFirst();
  console.log('--- Store Settings ---');
  console.log('heroImageUrl:', s?.heroImageUrl);
  console.log('heroTitle:', s?.heroTitle);
  console.log('logoText:', s?.logoText);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
