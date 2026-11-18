import React from 'react';
import { prisma } from '@/lib/db';
import { verifyPasskey } from '@/lib/admin-auth';
import { smartSearchProducts } from '@/lib/smart-search';
import {
  CollectionCatalog,
  type CatalogProduct,
} from '@/components/storefront/collection-catalog';
import { SearchAuthRedirect } from '@/components/storefront/search-auth-redirect';

export const dynamic = 'force-dynamic';

export default async function CollectionsAllPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  const cleanQuery = q?.trim() || '';

  let products: CatalogProduct[] = [];
  let storeRecord: {
    adminPasskeyHash: string | null;
    communityTitle: string;
    communitySubtitle: string;
    communityCtaText: string;
    communityLink: string;
  } | null = null;

  try {
    const [dbProducts, dbStore] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: { variants: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.store.findFirst({
        orderBy: { createdAt: 'asc' },
        select: {
          adminPasskeyHash: true,
          communityTitle: true,
          communitySubtitle: true,
          communityCtaText: true,
          communityLink: true,
        },
      }),
    ]);

    storeRecord = dbStore;
    products = dbProducts.map((p) => {
      let parsedImages: string[] = [];
      try {
        parsedImages = JSON.parse(p.images || '[]');
      } catch {
        parsedImages = [];
      }
      return {
        id: p.id,
        title: p.title,
        handle: p.handle,
        description: p.description,
        tags: p.tags,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        featuredImage: p.featuredImage,
        images: parsedImages,
        createdAt: p.createdAt.toISOString(),
        variants: p.variants.map((v) => ({
          id: v.id,
          option1: v.option1,
          price: v.price,
          inventoryQuantity: v.inventoryQuantity,
        })),
      };
    });
  } catch (e) {
    console.error('Collections query error:', e);
  }

  // Fast path: only run encrypted founder passkey verification if query matched zero products
  if (cleanQuery.length >= 6 && !cleanQuery.includes(' ')) {
    const matchedProducts = smartSearchProducts(products, cleanQuery);
    if (
      matchedProducts.length === 0 &&
      verifyPasskey(cleanQuery, storeRecord?.adminPasskeyHash)
    ) {
      return <SearchAuthRedirect query={cleanQuery} />;
    }
  }

  return (
    <CollectionCatalog
      initialProducts={products}
      initialQuery={cleanQuery}
      initialSort={sort || 'featured'}
      community={{
        title: storeRecord?.communityTitle || 'Join Pairs Community !',
        subtitle:
          storeRecord?.communitySubtitle ||
          'Get early access to exclusive Damascus drops, custom forged pieces, and collector discounts.',
        ctaText: storeRecord?.communityCtaText || 'Access',
        link: storeRecord?.communityLink || '/contact',
      }}
    />
  );
}
