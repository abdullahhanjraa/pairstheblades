'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  Search,
  LayoutGrid,
  Grid2x2,
  Square,
  Check,
} from 'lucide-react';
import { ProductCard, type ProductCardProps } from '@/components/storefront/product-card';
import { smartSearchProducts, type SearchableProduct } from '@/lib/smart-search';

export interface CatalogProduct extends ProductCardProps, SearchableProduct {
  description?: string;
  tags?: string;
  createdAt?: string;
}

interface CommunityConfig {
  title: string;
  subtitle: string;
  ctaText: string;
  link: string;
}

interface CollectionCatalogProps {
  initialProducts: CatalogProduct[];
  initialQuery?: string;
  initialSort?: string;
  community: CommunityConfig;
}

type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'alpha-asc';

export function CollectionCatalog({
  initialProducts,
  initialQuery = '',
  initialSort = 'featured',
  community,
}: CollectionCatalogProps) {
  const router = useRouter();
  const [searchText, setSearchText] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortOption>(
    (['featured', 'newest', 'price-asc', 'price-desc', 'alpha-asc'].includes(initialSort)
      ? initialSort
      : 'featured') as SortOption
  );
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [mobileSingleCol, setMobileSingleCol] = useState(false);
  const [desktopCompact, setDesktopCompact] = useState(true); // 4-col vs 2-col on desktop

  // Keep synced if user navigates via Navbar search while already on /collections/all
  useEffect(() => {
    setSearchText(initialQuery);
  }, [initialQuery]);

  // Sub-millisecond instant smart fuzzy filter & sort
  const filteredProducts = useMemo(() => {
    let list = searchText.trim()
      ? smartSearchProducts(initialProducts, searchText.trim())
      : [...initialProducts];

    if (inStockOnly) {
      list = list.filter((p) => {
        if (!p.variants || p.variants.length === 0) return true;
        return p.variants.some((v) => (v.inventoryQuantity ?? 0) > 0);
      });
    }

    if (onSaleOnly) {
      list = list.filter((p) => Boolean(p.compareAtPrice && p.compareAtPrice > p.price));
    }

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'alpha-asc') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'newest') {
      list = [...list].sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );
    }

    return list;
  }, [initialProducts, searchText, inStockOnly, onSaleOnly, sortBy]);

  const activeFilterCount =
    (inStockOnly ? 1 : 0) +
    (onSaleOnly ? 1 : 0) +
    (sortBy !== 'featured' ? 1 : 0);

  const handleResetAll = () => {
    setSearchText('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSortBy('featured');
    router.replace('/collections/all', { scroll: false });
  };

  const gridClassName = [
    'grid',
    mobileSingleCol ? 'grid-cols-1' : 'grid-cols-2',
    desktopCompact ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-2',
    'gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10',
  ].join(' ');

  return (
    <div className="bg-white min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-12 sm:pb-16">
        {/* Clean Editorial Left-Aligned Page Title (pairsclothing.com layout) */}
        <div className="mb-5 sm:mb-7 text-left">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black font-sans">
            {searchText.trim() ? `Search: "${searchText.trim()}"` : 'Products'}
          </h1>

          {/* Inline Instant Smart Search Bar when searching */}
          {searchText.trim().length > 0 && (
            <div className="mt-3 max-w-md flex items-center border-b border-neutral-300 focus-within:border-black transition-colors pb-1.5">
              <Search className="w-3.5 h-3.5 text-neutral-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Refine search..."
                className="w-full text-xs sm:text-sm bg-transparent focus:outline-none text-black placeholder-neutral-400"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchText('');
                  router.replace('/collections/all', { scroll: false });
                }}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Minimal Single-Row Utility Bar (Filter on Left | Count & Grid Toggle on Right) */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-100 text-xs">
          {/* Left: Minimal Filter Trigger + Active Filter Pills */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="inline-flex items-center space-x-2 text-xs font-medium text-neutral-800 hover:text-black transition-colors py-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {inStockOnly && (
              <button
                type="button"
                onClick={() => setInStockOnly(false)}
                className="inline-flex items-center space-x-1 px-2 py-0.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-[11px] rounded-full cursor-pointer"
              >
                <span>In stock</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {onSaleOnly && (
              <button
                type="button"
                onClick={() => setOnSaleOnly(false)}
                className="inline-flex items-center space-x-1 px-2 py-0.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-[11px] rounded-full cursor-pointer"
              >
                <span>On sale</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {sortBy !== 'featured' && (
              <button
                type="button"
                onClick={() => setSortBy('featured')}
                className="inline-flex items-center space-x-1 px-2 py-0.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-[11px] rounded-full cursor-pointer"
              >
                <span>
                  {sortBy === 'price-asc'
                    ? 'Price: Low to High'
                    : sortBy === 'price-desc'
                    ? 'Price: High to Low'
                    : sortBy === 'newest'
                    ? 'Newest'
                    : 'A–Z'}
                </span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Right: Count + Clean Grid Layout Toggle (Matches pairsclothing.com) */}
          <div className="flex items-center space-x-3 text-neutral-500">
            <span className="text-[11px] tracking-wide tabular-nums">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'product' : 'products'}
            </span>

            {/* Mobile Grid Toggle (1-col vs 2-col) */}
            <div className="flex sm:hidden items-center space-x-1 border-l border-neutral-200 pl-2.5">
              <button
                type="button"
                onClick={() => setMobileSingleCol(true)}
                className={`p-1 transition-colors cursor-pointer ${
                  mobileSingleCol ? 'text-black' : 'text-neutral-300 hover:text-neutral-600'
                }`}
                aria-label="Single column view"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMobileSingleCol(false)}
                className={`p-1 transition-colors cursor-pointer ${
                  !mobileSingleCol ? 'text-black' : 'text-neutral-300 hover:text-neutral-600'
                }`}
                aria-label="Two column view"
              >
                <Grid2x2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Desktop Grid Toggle (2-col vs 4-col) */}
            <div className="hidden sm:flex items-center space-x-1 border-l border-neutral-200 pl-3">
              <button
                type="button"
                onClick={() => setDesktopCompact(false)}
                className={`p-1 transition-colors cursor-pointer ${
                  !desktopCompact ? 'text-black' : 'text-neutral-300 hover:text-neutral-600'
                }`}
                aria-label="Large grid view"
              >
                <Grid2x2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDesktopCompact(true)}
                className={`p-1 transition-colors cursor-pointer ${
                  desktopCompact ? 'text-black' : 'text-neutral-300 hover:text-neutral-600'
                }`}
                aria-label="Compact grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-sm sm:text-base font-medium text-black">
              No products found matching &ldquo;{searchText.trim()}&rdquo;
            </p>
            <p className="text-xs text-neutral-500">
              Try checking your spelling or browsing our full blade catalog.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleResetAll}
                className="px-6 py-2.5 bg-black text-white text-xs font-semibold uppercase tracking-widest hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                View All Products
              </button>
            </div>
          </div>
        ) : (
          <div className={gridClassName}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>

      {/* Editorial Community Section (Matches bottom of pairsclothing.com/collections/all) */}
      <section className="border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-left">
          <div className="max-w-md space-y-2.5">
            <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight">
              {community.title.replace(/^_|_$/g, '')}
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {community.subtitle}
            </p>
            <div className="pt-2">
              <a
                href={community.link || '/contact'}
                target={community.link?.startsWith('http') ? '_blank' : undefined}
                rel={community.link?.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-block px-5 py-2 border border-neutral-300 text-xs font-medium text-black hover:border-black hover:bg-black hover:text-white transition-colors"
              >
                {community.ctaText || 'Access'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Slide-Over Filter & Sort Drawer */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity"
            onClick={() => setFilterDrawerOpen(false)}
          />
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200 text-left">
            <div>
              <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-black">
                  Filter &amp; Sort
                </h2>
                <button
                  type="button"
                  onClick={() => setFilterDrawerOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-black cursor-pointer"
                  aria-label="Close filter drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-7 overflow-y-auto">
                {/* Sort By */}
                <div className="space-y-2.5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
                    Sort by
                  </h3>
                  <div className="space-y-1">
                    {[
                      { value: 'featured', label: 'Featured' },
                      { value: 'newest', label: 'Date, new to old' },
                      { value: 'price-asc', label: 'Price, low to high' },
                      { value: 'price-desc', label: 'Price, high to low' },
                      { value: 'alpha-asc', label: 'Alphabetically, A–Z' },
                    ].map((opt) => {
                      const active = sortBy === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSortBy(opt.value as SortOption)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                            active
                              ? 'bg-neutral-100 font-semibold text-black'
                              : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {active && <Check className="w-3.5 h-3.5 text-black" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Availability & Offers */}
                <div className="space-y-3 pt-4 border-t border-neutral-100">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
                    Availability
                  </h3>
                  <label className="flex items-center space-x-3 text-xs text-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 accent-black cursor-pointer"
                    />
                    <span>In stock only</span>
                  </label>
                  <label className="flex items-center space-x-3 text-xs text-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={(e) => setOnSaleOnly(e.target.checked)}
                      className="w-4 h-4 accent-black cursor-pointer"
                    />
                    <span>On sale only</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-neutral-100 flex items-center space-x-3">
              <button
                type="button"
                onClick={handleResetAll}
                className="flex-1 py-2.5 border border-neutral-300 text-xs font-medium text-neutral-700 hover:border-black hover:text-black transition-colors cursor-pointer"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="flex-1 py-2.5 bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
