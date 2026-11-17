'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPKR } from '@/lib/formatters';
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

  // Secondary image for hover swap if available
  const secondaryImage = images.length > 1 ? images[1] : featuredImage;
  const isOnSale = compareAtPrice && compareAtPrice > price;

  const handleQuickAdd = (variant?: { id: string; option1: string; price: number }) => {
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
      {/* Image Container - 100% Uncropped Showcase */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-neutral-900/5 border border-neutral-200/60 rounded-xs">
        {/* Ambient subtle glow matching the photo to smoothly fill edges */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center blur-xl opacity-20 scale-110 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${featuredImage})` }}
        />

        <Link href={`/products/${handle}`} className="relative z-10 block w-full h-full p-2.5 sm:p-3">
          {/* Primary image */}
          <Image
            src={featuredImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-contain object-center transition-all duration-500 ease-out p-2 ${
              isHovered && secondaryImage !== featuredImage
                ? 'opacity-0 scale-105'
                : 'opacity-100 scale-100'
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
              className={`object-contain object-center absolute inset-0 transition-all duration-500 ease-out p-2 ${
                isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            />
          )}
        </Link>

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {isOnSale && (
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-white text-black shadow-sm">
              Sale
            </span>
          )}
        </div>

        {/* Quick Add Action Overlay */}
        <div className="absolute inset-x-2 bottom-2 z-20">
          {variants.length <= 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleQuickAdd();
              }}
              className="w-full py-2.5 bg-white/95 backdrop-blur-sm text-black text-xs font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-md hover:bg-black hover:text-white"
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
              className="w-full py-2.5 bg-white/95 backdrop-blur-sm text-black text-xs font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-md hover:bg-black hover:text-white"
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
                    className="px-2 py-1 text-[11px] font-medium border border-neutral-200 hover:border-black hover:bg-black hover:text-white transition-colors"
                  >
                    {v.option1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="pt-3 pb-1 flex flex-col">
        <Link
          href={`/products/${handle}`}
          className="text-xs sm:text-sm font-medium uppercase tracking-[0.08em] text-black hover:text-neutral-600 transition-colors line-clamp-1"
        >
          {title}
        </Link>

        <div className="mt-1 flex items-baseline space-x-2">
          <span className="text-xs sm:text-sm font-bold text-black tracking-tight">
            {formatPKR(price)}
          </span>
          {isOnSale && (
            <span className="text-[11px] sm:text-xs text-neutral-400 line-through">
              {formatPKR(compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
