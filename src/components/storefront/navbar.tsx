'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, Menu, X, ShieldCheck } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

interface NavbarProps {
  logoText?: string;
}

export function Navbar({ logoText = 'PAIRS' }: NavbarProps) {
  const router = useRouter();
  const { openCart, itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'All Products', href: '/collections/all' },
    { label: 'Track Order', href: '/track' },
    { label: 'Contact', href: '/contact' },
  ];

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Dynamically check against active encrypted founder passkey in Supabase (zero hardcoded secrets)
    if (query.length >= 6) {
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
            window.location.href = data.redirectTo;
            return;
          }
        }
      } catch {
        // Fall through to standard product catalog search on any network hiccup
      }
    }

    router.push(`/collections/all?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
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
                className="md:hidden p-2 text-black hover:text-neutral-600 focus:outline-none"
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

            {/* Right: Search & Cart */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                type="button"
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

        {/* Quick Search Dropdown Bar */}
        {searchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="border-t border-neutral-100 bg-white py-3 px-4 sm:px-8 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="max-w-3xl mx-auto flex items-center space-x-3">
              <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blades, Damascus knives, swords (e.g. Chef Knife, Katana, Bowie)..."
                className="w-full bg-transparent text-xs sm:text-sm focus:outline-none placeholder-neutral-400 font-light"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs uppercase tracking-wider text-neutral-400 hover:text-black ml-1"
              >
                Close
              </button>
            </div>
          </form>
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
                  className="p-2 text-neutral-500 hover:text-black"
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

            <div className="pt-6 border-t border-neutral-100 text-xs text-neutral-500 space-y-2">
              <p>Shipping all over Pakistan</p>
              <p>Cash on Delivery Available</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
