'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, Menu, X, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import { CurrencySwitcher } from '@/components/storefront/currency-switcher';
import { smartSearchProducts, type SearchableProduct } from '@/lib/smart-search';

interface NavbarProps {
  logoText?: string;
}

export function Navbar({ logoText = 'PAIRS' }: NavbarProps) {
  const router = useRouter();
  const { openCart, itemCount } = useCart();
  const { formatPrice } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalog, setCatalog] = useState<SearchableProduct[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const catalogFetchRef = useRef<Promise<void> | null>(null);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'All Products', href: '/collections/all' },
    { label: 'Track Order', href: '/track' },
    { label: 'Contact', href: '/contact' },
  ];

  const prefetchCatalog = () => {
    if (catalogLoaded || catalogFetchRef.current) return;
    catalogFetchRef.current = fetch('/api/products/catalog')
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        if (Array.isArray(data?.products)) {
          setCatalog(data.products);
        }
        setCatalogLoaded(true);
      })
      .catch(() => {
        catalogFetchRef.current = null;
      });
  };

  useEffect(() => {
    if (searchOpen) {
      prefetchCatalog();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen]);

  // Sub-millisecond instant smart fuzzy matching as user types
  const liveResults = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return [];
    return smartSearchProducts(catalog, trimmed).slice(0, 6);
  }, [catalog, searchQuery]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Fast path: if product matches exist, navigate instantaneously with zero auth wait
    if (liveResults.length > 0) {
      setSearchOpen(false);
      router.push(`/collections/all?q=${encodeURIComponent(query)}`);
      return;
    }

    // Only check encrypted founder access when no product matched and query looks like a passkey
    if (query.length >= 6 && !query.includes(' ')) {
      setIsCheckingAccess(true);
      try {
        const res = await fetch('/api/admin/search-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.granted && data?.redirectTo) {
            setSearchOpen(false);
            setSearchQuery('');
            setIsCheckingAccess(false);
            window.location.href = data.redirectTo;
            return;
          }
        }
      } catch {
        // Fall through to standard product catalog search
      } finally {
        setIsCheckingAccess(false);
      }
    }

    setSearchOpen(false);
    router.push(`/collections/all?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: Mobile hamburger & Desktop Navigation */}
            <div className="flex items-center space-x-8">
              <button
                type="button"
                className="md:hidden p-2 text-black hover:text-neutral-600 focus:outline-none cursor-pointer"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <nav className="hidden md:flex items-center space-x-7">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-xs uppercase tracking-[0.18em] font-medium text-black hover:text-neutral-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center: Dynamic Brand Logo */}
            <div className="flex-1 text-center md:flex-initial">
              <Link href="/" className="inline-block">
                <span className="font-extrabold text-2xl sm:text-3xl tracking-[0.25em] text-black uppercase font-sans">
                  {logoText}
                </span>
              </Link>
            </div>

            {/* Right: Currency Switcher, Search & Cart */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <CurrencySwitcher variant="header" />

              <button
                type="button"
                onMouseEnter={prefetchCatalog}
                onFocus={prefetchCatalog}
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-black hover:text-neutral-600 transition-colors cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={openCart}
                className="relative p-2 text-black hover:text-neutral-600 transition-colors cursor-pointer"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-black rounded-full animate-in fade-in zoom-in duration-150">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instant Predictive Smart Search Panel */}
        {searchOpen && (
          <div className="border-t border-neutral-100 bg-white shadow-lg animate-in slide-in-from-top-2 duration-150">
            <form
              onSubmit={handleSearchSubmit}
              className="py-3 px-4 sm:px-8"
            >
              <div className="max-w-3xl mx-auto flex items-center space-x-3">
                <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search blades, Damascus, Katana, Chef Knife, Cleaver..."
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-transparent text-xs sm:text-sm focus:outline-none placeholder-neutral-400 font-normal text-black"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isCheckingAccess}
                  className="px-3.5 py-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isCheckingAccess ? '...' : 'Search'}
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-xs uppercase tracking-wider text-neutral-400 hover:text-black ml-1 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>

            {/* Instant Live Predictive Results */}
            {searchQuery.trim().length > 0 && catalogLoaded && (
              <div className="border-t border-neutral-100 max-w-3xl mx-auto px-4 sm:px-0 py-3">
                {liveResults.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2 pb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                        Products ({liveResults.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const q = searchQuery.trim();
                          setSearchOpen(false);
                          router.push(`/collections/all?q=${encodeURIComponent(q)}`);
                        }}
                        className="text-[11px] font-medium text-neutral-600 hover:text-black flex items-center space-x-1 cursor-pointer"
                      >
                        <span>View all results</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="divide-y divide-neutral-100 max-h-[55vh] overflow-y-auto">
                      {liveResults.map((item) => {
                        const onSale = item.compareAtPrice && item.compareAtPrice > item.price;
                        return (
                          <Link
                            key={item.id}
                            href={`/products/${item.handle}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center space-x-3.5 py-2.5 px-2 hover:bg-neutral-50 transition-colors group"
                          >
                            <div className="relative w-14 h-11 bg-[#f6f6f6] flex-shrink-0 overflow-hidden border border-neutral-100">
                              <Image
                                src={item.featuredImage}
                                alt={item.title}
                                fill
                                sizes="56px"
                                className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-xs sm:text-sm font-medium text-neutral-900 truncate group-hover:text-black">
                                {item.title}
                              </p>
                              <div className="flex items-baseline space-x-2 mt-0.5 tabular-nums">
                                <span className="text-xs font-semibold text-black">
                                  {formatPrice(item.price)}
                                </span>
                                {onSale && (
                                  <span className="text-[11px] text-red-500/80 line-through">
                                    {formatPrice(item.compareAtPrice!)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-black transition-colors flex-shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-4 px-2 flex items-center justify-between text-xs text-neutral-500">
                    <span>No matching products for &ldquo;{searchQuery.trim()}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push('/collections/all');
                      }}
                      className="text-black font-medium underline underline-offset-4 cursor-pointer"
                    >
                      Browse all products
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 text-left">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
                <span className="font-extrabold text-xl tracking-[0.25em] uppercase">
                  {logoText}
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-neutral-500 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-8 flex flex-col space-y-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm uppercase tracking-[0.2em] font-medium text-black hover:text-neutral-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-neutral-100 space-y-5">
              <CurrencySwitcher
                variant="mobile"
                onSelect={() => setMobileMenuOpen(false)}
              />
              <div className="text-xs text-neutral-500 space-y-1">
                <p>Nationwide Pakistan &amp; Worldwide Shipping</p>
                <p>COD, Bank Transfer &amp; Payoneer Accepted</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
