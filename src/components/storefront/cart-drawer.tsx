'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';

interface CartDrawerProps {
  freeShippingThreshold?: number;
  shippingFee?: number;
}

export function CartDrawer({
  freeShippingThreshold = 5000.0,
  shippingFee = 250.0,
}: CartDrawerProps = {}) {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const { formatPrice, isInternational } = useCurrency();

  if (!isOpen) return null;

  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-black" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-black">
                Your Cart ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 text-neutral-400 hover:text-black transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-100">
            <div className="flex items-center space-x-2 text-xs font-medium text-neutral-700">
              <Truck className="w-4 h-4 text-black flex-shrink-0" />
              {subtotal >= freeShippingThreshold ? (
                <span className="text-emerald-700 font-semibold">
                  You qualify for Free Nationwide Shipping!
                </span>
              ) : (
                <span>
                  Add <strong className="text-black tabular-nums">{formatPrice(remainingForFreeShipping)}</strong> more to get Free Shipping
                </span>
              )}
            </div>
            <div className="w-full bg-neutral-200 h-1.5 mt-2 rounded-full overflow-hidden">
              <div
                className="bg-black h-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-neutral-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <ShoppingBag className="w-12 h-12 text-neutral-300 stroke-[1] mb-3" />
                <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider">
                  Your cutlery bag is empty
                </p>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                  Discover our hand-forged Damascus blades, chef cutlery, and collector swords.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-6 px-6 py-2.5 bg-black text-white text-xs font-semibold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                >
                  Explore Cutlery Catalog
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.variantId} className="py-4 flex space-x-4">
                  {/* Thumbnail - Uncropped */}
                  <div className="relative w-20 h-20 bg-neutral-50 border border-neutral-200 flex-shrink-0 overflow-hidden rounded-xs p-1">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain object-center"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between text-left">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-black line-clamp-1">
                          {item.title}
                        </h3>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-neutral-400 hover:text-red-600 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.variantTitle}
                      </p>

                      <div className="text-xs font-bold text-black mt-1 tabular-nums">
                        {formatPrice(item.price)}
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center border border-neutral-200">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 hover:bg-neutral-100 text-neutral-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-medium text-black min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1 hover:bg-neutral-100 text-neutral-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="px-6 py-5 border-t border-neutral-100 bg-neutral-50/50 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-neutral-600 uppercase tracking-wider text-xs">
                  Subtotal
                </span>
                <span className="font-extrabold text-black text-base tabular-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <p className="text-[11px] text-neutral-500 text-left">
                {isInternational
                  ? 'Shipping calculated at checkout. Payoneer & International transfer accepted.'
                  : 'Shipping & taxes calculated at checkout. Cash on delivery available.'}
              </p>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full block py-3.5 bg-black text-white text-center text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors shadow-md"
              >
                Proceed to Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
