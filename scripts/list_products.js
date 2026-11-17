const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const products = await prisma.product.findMany({
    include: { variants: true }
  });
  console.log(`Found ${products.length} products in database:`);
  products.forEach(p => {
    console.log(`- ${p.title} (ID: ${p.id}, Handle: ${p.handle}) - ${p.variants.length} variants`);
  });
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
