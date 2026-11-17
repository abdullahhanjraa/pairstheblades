import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding store database with master cutlery & blades catalog...');

  // 1. Reset tables
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();

  // 2. Create store with clean settings
  const store = await prisma.store.create({
    data: {
      name: 'Pairs Cutlery & Blades',
      handle: 'pairs-blades',
      announcement: 'Shipping all over Pakistan! Cash on delivery available nationwide. Handcrafted blades live now!',
      currency: 'PKR',
      currencySymbol: 'Rs.',
      freeShippingThreshold: 5000.0,
      shippingFee: 250.0,
      heroTag: 'Master Forged / Live Now',
      heroTitle: 'Precision Steel',
      heroDescription: 'Master craftsmanship. Unrivaled edge retention. Premium handcrafted Damascus knives, chef cutlery, and swords with nationwide cash on delivery.',
      heroCtaText: 'Explore Catalog',
      heroCtaLink: '#products',
      valueProp1: 'Free Shipping Over Rs. 5,000',
      valueProp2: 'Cash On Delivery Nationwide',
      valueProp3: 'Hand-Inspected Edge & Blade Warranty',
      catalogTitle: '_FEATURED BLADES >>>_',
      catalogSubtitle: 'Limited production batch forged from premium high-carbon Damascus steel.',
      communityTitle: '_Join VIP Blade Club !_',
      communitySubtitle: 'Get early access to exclusive Damascus drops, custom forged pieces, and collector discounts.',
      communityLink: 'https://whatsapp.com/channel/0029Vb8BubO5K3zVoOAX9B0G',
      communityCtaText: 'Join WhatsApp',
      bankName: 'Meezan Bank Ltd',
      bankBranch: 'Main Boulevard, Gulberg III, Lahore',
      bankAccountTitle: 'PAIRS CUTLERY PVT LTD',
      bankAccountNumber: '01020304050607',
      bankIban: 'PK36MEZN0001020304050607',
    },
  });

  console.log(`Created store: ${store.name}`);

  const productsData = [
    {
      title: 'Damascus Steel Chef Knife 8"',
      handle: 'damascus-steel-chef-knife-8',
      price: 8499.0,
      compareAtPrice: 10500.0,
      stock: 25,
      featuredImage: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1200&auto=format&fit=crop',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1568285563394-722b8c7b8f7e?q=80&w=1200&auto=format&fit=crop',
      ]),
      description: 'Hand-forged 67-layer Damascus steel chef knife with VG-10 cutting core. Features an ergonomic rosewood handle, razor-sharp 15-degree edge bevel, and custom magnetic presentation packaging.',
    },
    {
      title: 'Bushcraft Heavy Bowie Hunting Blade',
      handle: 'bushcraft-heavy-bowie-hunting-blade',
      price: 6999.0,
      compareAtPrice: 8500.0,
      stock: 20,
      featuredImage: 'https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?q=80&w=1200&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?q=80&w=1200&auto=format&fit=crop',
      ],
      description: 'Full-tang heavy-duty high-carbon steel hunting blade designed for outdoor survival, camping, and fieldwork. Features textured micarta scales and handcrafted genuine leather sheath.',
    },
    {
      title: 'Hand-Forged Katana Sword (1095 Carbon)',
      handle: 'hand-forged-katana-sword-1095-carbon',
      price: 24999.0,
      compareAtPrice: 29500.0,
      stock: 10,
      featuredImage: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200&auto=format&fit=crop',
      ],
      description: 'Traditional clay-tempered battle-ready Katana sword with authentic hamon line, genuine rayskin tsuka grip, and matte black lacquered wooden scabbard (saya).',
    },
    {
      title: 'Japanese Santoku Kitchen Knife',
      handle: 'japanese-santoku-kitchen-knife',
      price: 7499.0,
      compareAtPrice: 9200.0,
      stock: 18,
      featuredImage: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?q=80&w=1200&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?q=80&w=1200&auto=format&fit=crop',
      ],
      description: 'Three-virtue Japanese Santoku knife engineered for effortless slicing, dicing, and mincing. Hammered tsuchime finish prevents food adherence.',
    },
    {
      title: 'Damascus Steel Tactical Tanto Dagger',
      handle: 'damascus-steel-tactical-tanto-dagger',
      price: 5999.0,
      compareAtPrice: 7500.0,
      stock: 15,
      featuredImage: 'https://images.unsplash.com/photo-1568285563394-722b8c7b8f7e?q=80&w=1200&auto=format&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1568285563394-722b8c7b8f7e?q=80&w=1200&auto=format&fit=crop',
      ],
      description: 'Compact tactical tanto blade hand-forged from twisted pattern Damascus steel with a reinforced piercing tip, brass bolster guard, and protective sheath.',
    },
  ];

  for (const p of productsData) {
    const imagesArray = Array.isArray(p.images) ? JSON.stringify(p.images) : p.images;
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        title: p.title,
        handle: p.handle,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        featuredImage: p.featuredImage,
        images: imagesArray,
        status: 'ACTIVE',
        variants: {
          create: [
            {
              title: 'Default',
              option1: 'Standard',
              price: p.price,
              compareAtPrice: p.compareAtPrice,
              inventoryQuantity: p.stock,
              sku: `${p.handle.toUpperCase()}-STD`,
            },
          ],
        },
      },
    });
    console.log(`Created product: ${product.title} (Stock: ${p.stock})`);
  }

  // Seed sample initial order
  const chefKnife = await prisma.product.findFirst({ where: { handle: 'damascus-steel-chef-knife-8' } });
  const variant = await prisma.productVariant.findFirst({ where: { productId: chefKnife?.id } });

  if (chefKnife && variant) {
    await prisma.order.create({
      data: {
        storeId: store.id,
        orderNumber: 1001,
        customerName: 'Hamza Khan',
        customerEmail: 'hamza.khan@gmail.com',
        customerPhone: '+92 300 1234567',
        shippingAddress: 'House 42, Street 10, F-7/2',
        city: 'Islamabad',
        province: 'Federal Capital',
        postalCode: '44000',
        subtotalPrice: chefKnife.price,
        shippingPrice: 0.0, // Free over 5000
        totalPrice: chefKnife.price,
        paymentMethod: 'COD',
        financialStatus: 'PENDING',
        fulfillmentStatus: 'UNFULFILLED',
        items: {
          create: [
            {
              productId: chefKnife.id,
              variantId: variant.id,
              title: chefKnife.title,
              variantTitle: null,
              price: chefKnife.price,
              quantity: 1,
              image: chefKnife.featuredImage,
            },
          ],
        },
      },
    });
    console.log('Seeded sample order #1001');
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
