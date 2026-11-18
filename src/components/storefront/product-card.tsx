'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/lib/currency-context';
import { useCart } from '@/lib/cart-context';

export interface ProductCardProps {
  id: string;
  title: string;
  handle: string;
  price: number;
  compareAtPrice?: number | null;
  featuredImage: string;
  images?: string[];
  variants?: Array<{
    id: string;
    option1: string;
    price: number;
    inventoryQuantity: number;
  }>;
}

export function ProductCard({
  id,
  title,
  handle,
  price,
  compareAtPrice,
  featuredImage,
  images = [],
  variants = [],
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [quickSelectOpen, setQuickSelectOpen] = useState(false);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();

  // Secondary image for hover swap if available
  const secondaryImage = images.length > 1 ? images[1] : featuredImage;
  const isOnSale = Boolean(compareAtPrice && compareAtPrice > price);
  const totalStock =
    variants.length > 0
      ? variants.reduce((sum, v) => sum + (v.inventoryQuantity ?? 0), 0)
      : 1;
  const isSoldOut = totalStock <= 0;

  const handleQuickAdd = (variant?: { id: string; option1: string; price: number }) => {
    if (isSoldOut) return;
    const selected = variant || variants[0] || { id: 'default', option1: 'Standard', price };
    const hasMultipleVariants = variants.length > 1 && selected.option1 && selected.option1 !== 'Standard';
    addItem({
      productId: id,
      variantId: selected.id,
      title: title,
      variantTitle: hasMultipleVariants ? selected.option1 : '',
      price: selected.price || price,
      compareAtPrice: compareAtPrice,
      image: featuredImage,
      quantity: 1,
    });
    setQuickSelectOpen(false);
  };

  return (
    <div
      className="group relative flex flex-col w-full text-left"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setQuickSelectOpen(false);
      }}
    >
      {/* Clean Editorial Image Stage — 100% Uncropped Blade Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f6f6f6] border border-neutral-100 group-hover:border-neutral-200 transition-colors">
        <Link href={`/products/${handle}`} className="relative z-10 block w-full h-full p-2 sm:p-3">
          {/* Primary image */}
          <Image
            src={featuredImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-contain object-center transition-all duration-500 ease-out ${
              isHovered && secondaryImage !== featuredImage
                ? 'opacity-0 scale-103'
                : 'opacity-100 scale-100 group-hover:scale-103'
            }`}
            priority={false}
          />

          {/* Secondary image on hover */}
          {secondaryImage && secondaryImage !== featuredImage && (
            <Image
              src={secondaryImage}
              alt={`${title} alternate`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-contain object-center absolute inset-0 transition-all duration-500 ease-out p-2 sm:p-3 ${
                isHovered ? 'opacity-100 scale-103' : 'opacity-0 scale-100'
              }`}
            />
          )}
        </Link>

        {/* Top-Right Minimal Badge (pairsclothing.com Editorial Placement) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 pointer-events-none">
          {isSoldOut ? (
            <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide bg-white/95 text-neutral-700 border border-neutral-200/80">
              Sold out
            </span>
          ) : isOnSale ? (
            <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide bg-white/95 text-neutral-900 border border-neutral-200/80">
              Sale
            </span>
          ) : null}
        </div>

        {/* Quick Add Action Overlay (Desktop Hover) */}
        {!isSoldOut && (
          <div className="hidden sm:block absolute inset-x-2 bottom-2 z-20">
            {variants.length <= 1 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleQuickAdd();
                }}
                className="w-full py-2 bg-white/95 backdrop-blur-sm text-black text-[11px] font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-sm hover:bg-black hover:text-white cursor-pointer"
              >
                Quick Add
              </button>
            ) : !quickSelectOpen ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setQuickSelectOpen(true);
                }}
                className="w-full py-2 bg-white/95 backdrop-blur-sm text-black text-[11px] font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-sm hover:bg-black hover:text-white cursor-pointer"
              >
                Choose Option
              </button>
            ) : (
              <div className="w-full bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1.5 text-center">
                  Select Option
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleQuickAdd(v)}
                      className="px-2 py-1 text-[11px] font-medium border border-neutral-200 hover:border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                    >
                      {v.option1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Info — Clean Editorial Hierarchy (pairsclothing.com style) */}
      <div className="pt-2.5 pb-1 flex flex-col">
        <Link
          href={`/products/${handle}`}
          className="text-[11px] sm:text-xs font-normal tracking-wide text-neutral-800 hover:text-black transition-colors line-clamp-1"
        >
          {title}
        </Link>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs sm:text-[13px] font-medium text-black tracking-tight tabular-nums">
            {formatPrice(price)}
          </span>
          {isOnSale && (
            <span className="text-[11px] sm:text-xs text-red-500/80 line-through tabular-nums">
              {formatPrice(compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
