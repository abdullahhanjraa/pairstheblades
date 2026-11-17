const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  const store = await prisma.store.findFirst();
  if (store) {
    const updated = await prisma.store.update({
      where: { id: store.id },
      data: {
        heroImageUrl: '/images/hero-banner.png',
        logoText: 'PAIRS',
      },
    });
    console.log('✅ Store updated:');
    console.log('heroImageUrl:', updated.heroImageUrl);
    console.log('logoText:', updated.logoText);
  }
}

update()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
