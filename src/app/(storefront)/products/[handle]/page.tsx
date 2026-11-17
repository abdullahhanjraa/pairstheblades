import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ProductDetailView } from './product-detail-view';

export const dynamic = 'force-dynamic';

const FALLBACK_PRODUCTS_MAP: Record<string, any> = {
  'damascus-steel-chef-knife-8': {
    id: 'prod-1',
    title: 'Damascus Steel Chef Knife 8"',
    handle: 'damascus-steel-chef-knife-8',
    price: 8499.0,
    compareAtPrice: 10500.0,
    description:
      'Hand-forged 67-layer Damascus steel chef knife with VG-10 cutting core. Features an ergonomic rosewood handle, razor-sharp 15-degree edge bevel, and custom magnetic presentation packaging.',
    featuredImage: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568285563394-722b8c7b8f7e?q=80&w=1200&auto=format&fit=crop',
    ],
    variants: [
      { id: 'v1-std', option1: 'Standard', price: 8499.0, compareAtPrice: 10500.0, inventoryQuantity: 25 },
    ],
  },
  'bushcraft-heavy-bowie-hunting-blade': {
    id: 'prod-2',
    title: 'Bushcraft Heavy Bowie Hunting Blade',
    handle: 'bushcraft-heavy-bowie-hunting-blade',
    price: 6999.0,
    compareAtPrice: 8500.0,
    description:
      'Full-tang heavy-duty high-carbon steel hunting blade designed for outdoor survival, camping, and fieldwork. Features textured micarta scales and handcrafted genuine leather sheath.',
    featuredImage: 'https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?q=80&w=1200&auto=format&fit=crop',
    ],
    variants: [
      { id: 'v2-std', option1: 'Standard', price: 6999.0, compareAtPrice: 8500.0, inventoryQuantity: 20 },
    ],
  },
  'hand-forged-katana-sword-1095-carbon': {
    id: 'prod-3',
    title: 'Hand-Forged Katana Sword (1095 Carbon)',
    handle: 'hand-forged-katana-sword-1095-carbon',
    price: 24999.0,
    compareAtPrice: 29500.0,
    description:
      'Traditional clay-tempered battle-ready Katana sword with authentic hamon line, genuine rayskin tsuka grip, and matte black lacquered wooden scabbard (saya).',
    featuredImage: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200&auto=format&fit=crop',
    ],
    variants: [
      { id: 'v3-std', option1: 'Standard', price: 24999.0, compareAtPrice: 29500.0, inventoryQuantity: 10 },
    ],
  },
  'japanese-santoku-kitchen-knife': {
    id: 'prod-4',
    title: 'Japanese Santoku Kitchen Knife',
    handle: 'japanese-santoku-kitchen-knife',
    price: 7499.0,
    compareAtPrice: 9200.0,
    description:
      'Three-virtue Japanese Santoku knife engineered for effortless slicing, dicing, and mincing. Hammered tsuchime finish prevents food adherence.',
    featuredImage: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?q=80&w=1200&auto=format&fit=crop',
    ],
    variants: [
      { id: 'v4-std', option1: 'Standard', price: 7499.0, compareAtPrice: 9200.0, inventoryQuantity: 18 },
    ],
  },
  'damascus-steel-tactical-tanto-dagger': {
    id: 'prod-5',
    title: 'Damascus Steel Tactical Tanto Dagger',
    handle: 'damascus-steel-tactical-tanto-dagger',
    price: 5999.0,
    compareAtPrice: 7500.0,
    description:
      'Compact tactical tanto blade hand-forged from twisted pattern Damascus steel with a reinforced piercing tip, brass bolster guard, and protective sheath.',
    featuredImage: 'https://images.unsplash.com/photo-1568285563394-722b8c7b8f7e?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1568285563394-722b8c7b8f7e?q=80&w=1200&auto=format&fit=crop',
    ],
    variants: [
      { id: 'v5-std', option1: 'Standard', price: 5999.0, compareAtPrice: 7500.0, inventoryQuantity: 15 },
    ],
  },
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  let product = FALLBACK_PRODUCTS_MAP[handle];

  try {
    const dbProduct = await prisma.product.findUnique({
      where: { handle },
      include: { variants: true },
    });

    if (dbProduct) {
      product = {
        id: dbProduct.id,
        title: dbProduct.title,
        handle: dbProduct.handle,
        price: dbProduct.price,
        compareAtPrice: dbProduct.compareAtPrice,
        description: dbProduct.description,
        featuredImage: dbProduct.featuredImage,
        images: JSON.parse(dbProduct.images || '[]'),
        variants: dbProduct.variants.map((v) => ({
          id: v.id,
          option1: v.option1,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          inventoryQuantity: v.inventoryQuantity,
        })),
      };
    }
  } catch (e) {
    // DB fallback
  }

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
