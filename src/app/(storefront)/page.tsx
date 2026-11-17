import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ProductCard } from '@/components/storefront/product-card';
import { Truck, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Fallback products if database has not been seeded yet
const FALLBACK_PRODUCTS: Array<{
  id: string;
  title: string;
  handle: string;
  price: number;
  compareAtPrice: number | null;
  featuredImage: string;
  images: string[];
  variants: Array<{
    id: string;
    option1: string;
    price: number;
    inventoryQuantity: number;
  }>;
}> = [
  {
    id: 'prod-1',
    title: 'Damascus Steel Chef Knife 8"',
    handle: 'damascus-steel-chef-knife-8',
    price: 8499.0,
    compareAtPrice: 10500.0,
    featuredImage: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568285563394-722b8c7b8f7e?q=80&w=1200&auto=format&fit=crop',
    ],
    variants: [
      { id: 'v1-std', option1: 'Standard', price: 8499.0, inventoryQuantity: 25 },
    ],
  },
  {
    id: 'prod-2',
    title: 'Bushcraft Heavy Bowie Hunting Blade',
    handle: 'bushcraft-heavy-bowie-hunting-blade',
    price: 6999.0,
    compareAtPrice: 8500.0,
    featuredImage: 'https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?q=80&w=1200&auto=format&fit=crop',
    ],
    variants: [
      { id: 'v2-std', option1: 'Standard', price: 6999.0, inventoryQuantity: 18 },
    ],
  },
  {
    id: 'prod-3',
    title: 'Hand-Forged Katana Sword 1095 Carbon',
    handle: 'hand-forged-katana-sword-1095-carbon',
    price: 24999.0,
    compareAtPrice: 29500.0,
    featuredImage: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200&auto=format&fit=crop',
    ],
    variants: [
      { id: 'v3-std', option1: 'Standard', price: 24999.0, inventoryQuantity: 10 },
    ],
  },
  {
    id: 'prod-4',
    title: 'Japanese Santoku Kitchen Knife',
    handle: 'japanese-santoku-kitchen-knife',
    price: 7499.0,
    compareAtPrice: 9200.0,
    featuredImage: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?q=80&w=1200&auto=format&fit=crop',
    ],
    variants: [
      { id: 'v4-std', option1: 'Standard', price: 7499.0, inventoryQuantity: 20 },
    ],
  },
];

export default async function HomePage() {
  let products = FALLBACK_PRODUCTS;
  let store: any = null;

  try {
    store = await prisma.store.findFirst();

    const dbProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });

    if (dbProducts.length > 0) {
      products = dbProducts.map((p) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        featuredImage: p.featuredImage,
        images: JSON.parse(p.images || '[]') as string[],
        variants: p.variants.map((v) => ({
          id: v.id,
          option1: v.option1,
          price: v.price,
          inventoryQuantity: v.inventoryQuantity,
        })),
      }));
    }
  } catch (err) {
    console.log('Using fallback products while DB connects');
  }

  // Dynamic Theme & Content defaults
  const heroImageUrl = store?.heroImageUrl || '/images/hero-banner.png';
  const heroTag = store?.heroTag || 'Master Forged / Live Now';
  const heroTitle = store?.heroTitle || 'Pairs Blades';
  const heroDescription =
    store?.heroDescription ||
    'Master craftsmanship. Unrivaled edge retention. Premium handcrafted Damascus knives, chef cutlery, and swords.';
  const heroCtaText = store?.heroCtaText || 'Explore Catalog';
  const heroCtaLink = store?.heroCtaLink || '#products';

  const valueProp1 = store?.valueProp1 || 'Free Shipping Over Rs. 5,000';
  const valueProp2 = store?.valueProp2 || 'Cash On Delivery Nationwide';
  const valueProp3 = store?.valueProp3 || 'Hand-Inspected Edge & Blade Warranty';

  const catalogTitle = store?.catalogTitle || '_FEATURED BLADES >>>_';
  const catalogSubtitle =
    store?.catalogSubtitle || 'Limited production batch forged from premium high-carbon Damascus steel.';

  const communityTitle = store?.communityTitle || '_Join Pairs Community !_';
  const communitySubtitle =
    store?.communitySubtitle ||
    'Get early access to all future drops, secret sales, and VIP community events.';
  const communityLink =
    store?.communityLink ||
    'https://whatsapp.com/channel/0029Vb8BubO5K3zVoOAX9B0G';
  const communityCtaText = store?.communityCtaText || 'Access';

  return (
    <div className="flex flex-col w-full">
      {/* 1. Dynamic Hero Section */}
      <section className="relative w-full h-[70vh] sm:h-[85vh] bg-neutral-900 overflow-hidden">
        <Image
          src={heroImageUrl}
          alt={heroTitle}
          fill
          priority
          unoptimized
          className="object-cover object-center brightness-90 transition-transform duration-1000 scale-100 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 lg:p-16 max-w-7xl mx-auto w-full">
          <div className="max-w-xl text-left space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-[0.25em]">
              {heroTag}
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white uppercase tracking-[0.1em] font-sans leading-none">
              {heroTitle}
            </h1>
            <p className="text-sm sm:text-base text-neutral-200 font-light max-w-md">
              {heroDescription}
            </p>
            <div className="pt-2">
              <a
                href={heroCtaLink}
                className="inline-flex items-center space-x-2 px-7 py-3.5 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all shadow-lg"
              >
                <span>{heroCtaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dynamic Value Props Bar */}
      <section className="border-b border-neutral-100 bg-neutral-50 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Truck className="w-4 h-4 text-black shrink-0" />
            <span className="text-xs uppercase tracking-wider font-medium text-neutral-800">
              {valueProp1}
            </span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-black shrink-0" />
            <span className="text-xs uppercase tracking-wider font-medium text-neutral-800">
              {valueProp2}
            </span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 text-black shrink-0" />
            <span className="text-xs uppercase tracking-wider font-medium text-neutral-800">
              {valueProp3}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Dynamic Product Grid */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 w-full">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold italic tracking-wide text-black font-serif underline decoration-1 underline-offset-8">
              {catalogTitle}
            </h2>
            <p className="text-xs text-neutral-500 mt-2 font-light">
              {catalogSubtitle}
            </p>
          </div>
          <span className="text-xs uppercase tracking-widest text-neutral-400 mt-2 sm:mt-0">
            {products.length} Products
          </span>
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* 4. Dynamic VIP Community Banner: _Join Pairs Community !_ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="relative bg-neutral-950 text-white p-8 sm:p-14 overflow-hidden text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
          <div className="max-w-lg space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold italic tracking-wider font-serif">
              {communityTitle}
            </h2>
            <p className="text-sm text-neutral-300 font-light">
              {communitySubtitle}
            </p>
            <div className="pt-3">
              <a
                href={communityLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-8 py-3.5 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors"
              >
                <span>{communityCtaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
