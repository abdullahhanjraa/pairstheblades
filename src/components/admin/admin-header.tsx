'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  ExternalLink,
  Store,
  Menu,
  X,
} from 'lucide-react';
import { AdminLockButton } from './admin-lock-button';

interface AdminHeaderProps {
  unfulfilledCount?: number;
  storeName?: string;
}

export function AdminHeader({ unfulfilledCount = 0, storeName }: AdminHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminLinks = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Products & Stock', href: '/admin/products', icon: Package },
    {
      label: 'Orders & Dispatch',
      href: '/admin/orders',
      icon: ShoppingBag,
      badge: unfulfilledCount > 0 ? unfulfilledCount : null,
    },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isLinkActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-900 text-white border-b border-neutral-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center space-x-6">
          <Link href="/admin" className="flex items-center space-x-2.5 group">
            <Store className="w-5 h-5 text-neutral-300 group-hover:text-white transition-colors" />
            <span className="font-extrabold text-sm uppercase tracking-wider text-white">
              {storeName || 'Pairs Knife & Sword Co.'}
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded border border-neutral-700/60">
              Control Panel
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                    active
                      ? 'bg-white text-black shadow-xs font-bold'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        active
                          ? 'bg-amber-500 text-black'
                          : 'bg-amber-400 text-neutral-900'
                      }`}
                      title={`${link.badge} orders awaiting dispatch`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded border border-neutral-700/60 transition-colors"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </Link>

          {/* Secure Lock Terminal Button */}
          <AdminLockButton />

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-t border-neutral-800 px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded transition-colors ${
                  active
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-black">
                    {link.badge} pending
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-neutral-800">
            <Link
              href="/"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Public Storefront</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
