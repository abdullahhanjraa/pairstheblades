import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ProductCard } from '@/components/storefront/product-card';
import { Filter, SlidersHorizontal, Search, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CollectionsAllPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;

  let products: any[] = [];

  try {
    const dbProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        ...(q && {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { handle: { contains: q } },
          ],
        }),
      },
      include: { variants: true },
      orderBy:
        sort === 'price-asc'
          ? { price: 'asc' }
          : sort === 'price-desc'
          ? { price: 'desc' }
          : { createdAt: 'desc' },
    });

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

    // Database products mapped
  } catch (e) {
    console.error('Collections query error:', e);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
          Curated Catalog
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold italic font-serif uppercase tracking-wider text-black">
          {q ? `Search: "${q}"` : '_ALL PRODUCTS >>>_'}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 font-light">
          {q
            ? `Showing matching catalog results for "${q}"`
            : 'Handcrafted custom edged cutlery, Damascus blades, and battle-ready swords.'}
        </p>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-neutral-100 gap-4 text-xs">
        {/* Status / Category tag */}
        <div className="flex items-center space-x-2 text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
          <span>Nationwide Delivery • Authentic Steel • Cash On Delivery</span>
        </div>

        {/* Sort & Count */}
        <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto">
          <span className="text-neutral-400 text-[11px] uppercase tracking-widest font-mono">
            {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </span>

          <div className="flex items-center space-x-2">
            <span className="text-neutral-500 text-[11px] font-bold uppercase tracking-wider">
              Sort:
            </span>
            <div className="flex items-center space-x-1">
              {[
                { label: 'Newest', value: 'newest' },
                { label: 'Price: Low to High', value: 'price-asc' },
                { label: 'Price: High to Low', value: 'price-desc' },
              ].map((s) => {
                const isActive = (!sort && s.value === 'newest') || sort === s.value;
                const queryParams = new URLSearchParams();
                if (q) queryParams.set('q', q);
                if (s.value !== 'newest') queryParams.set('sort', s.value);

                return (
                  <Link
                    key={s.value}
                    href={`/collections/all?${queryParams.toString()}`}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider ${
                      isActive
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid or Empty State */}
      {products.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <p className="text-base font-semibold text-black">No blades found matching your search</p>
          <p className="text-xs text-neutral-400">
            Try resetting your search query or check back soon for our next Damascus drop.
          </p>
          <div className="pt-3">
            <Link
              href="/collections/all"
              className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800"
            >
              Reset Filters
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}
    </div>
  );
}
