'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Truck, ShieldCheck, Plus, Minus, ArrowLeft, Maximize2, X } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import { trackStoreEvent } from '@/lib/analytics';

export interface ProductDetailViewProps {
  product: {
    id: string;
    title: string;
    handle: string;
    price: number;
    compareAtPrice?: number | null;
    description: string;
    featuredImage: string;
    images: string[];
    variants: Array<{
      id: string;
      option1: string;
      price: number;
      compareAtPrice?: number | null;
      inventoryQuantity: number;
    }>;
  };
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { formatPrice, isInternational } = useCurrency();
  const [selectedImage, setSelectedImage] = useState(product.featuredImage);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0] || {
      id: 'default',
      option1: 'Standard',
      price: product.price,
      inventoryQuantity: 20,
    }
  );
  const [quantity, setQuantity] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Fire ViewContent / PRODUCT_VIEW conversion event once per product mount
  React.useEffect(() => {
    trackStoreEvent('PRODUCT_VIEW', {
      productId: product.id,
      contentName: product.title,
      value: product.price,
    });
  }, [product.id, product.title, product.price]);

  // Close lightbox on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    if (isLightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isLightboxOpen]);

  // Accordion states
  const [openAccordion, setOpenAccordion] = useState<string | null>('fit');

  const toggleAccordion = (name: string) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const savings = isOnSale ? product.compareAtPrice! - product.price : 0;

  const handleAddToCart = () => {
    const isMultiVariant = product.variants.length > 1 && selectedVariant.option1 && selectedVariant.option1 !== 'Standard';
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      variantTitle: isMultiVariant ? selectedVariant.option1 : '',
      price: selectedVariant.price,
      compareAtPrice: product.compareAtPrice,
      image: selectedImage || product.featuredImage,
      quantity,
    });
  };

  const handleBuyItNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center space-x-2 text-xs text-neutral-500 uppercase tracking-widest font-light">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <Link href="/collections/all" className="hover:text-black">
          Products
        </Link>
        <span>/</span>
        <span className="text-black font-medium">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
        {/* Left Column: Image Gallery (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:w-20 sm:max-h-[540px] flex-shrink-0">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 border transition-all rounded-xs overflow-hidden bg-neutral-50/80 ${
                    selectedImage === img
                      ? 'border-black opacity-100 ring-1 ring-black shadow-2xs'
                      : 'border-neutral-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.title} thumb ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-contain object-center p-1"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Stage Image - 100% Uncropped Showcase */}
          <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full bg-neutral-50/80 border border-neutral-200/80 rounded-xs overflow-hidden flex items-center justify-center group shadow-2xs">
            {/* Sharp uncropped main photo */}
            <div
              className="relative w-full h-full p-2.5 sm:p-4 flex items-center justify-center z-10 cursor-zoom-in"
              onClick={() => setIsLightboxOpen(true)}
              title="Click to view full photo in high resolution"
            >
              <Image
                src={selectedImage || product.featuredImage}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-contain object-center transition-all duration-300 drop-shadow-xs"
              />
            </div>

            {isOnSale && (
              <span className="absolute top-3 left-3 z-20 px-2.5 py-1 bg-white text-black text-[10px] font-bold uppercase tracking-wider shadow-sm border border-neutral-200">
                Sale
              </span>
            )}

            {/* Expand / Fullscreen icon button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 z-20 p-2 bg-white/90 hover:bg-black hover:text-white text-neutral-800 rounded-xs shadow-sm border border-neutral-200 transition-colors cursor-pointer"
              title="View Fullscreen High-Res Photo"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Buy Box (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col text-left space-y-6">
          {/* Header & Title */}
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-400 font-medium">
              Handcrafted Damascus & High-Carbon Blades
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-black mt-1 font-sans">
              {product.title}
            </h1>

            {/* Pricing */}
            <div className="mt-3 flex items-baseline space-x-3 tabular-nums">
              <span className="text-xl sm:text-2xl font-black text-black">
                {formatPrice(product.price)}
              </span>
              {isOnSale && (
                <>
                  <span className="text-sm text-neutral-400 line-through">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Save {formatPrice(savings)}
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {isInternational
                ? 'Worldwide shipping available. Payoneer & international transfers accepted.'
                : 'Taxes included. Cash on delivery nationwide.'}
            </p>
          </div>

          {/* Product Variant / Stock Indicator */}
          {product.variants.length > 1 ? (
            <div className="border-t border-neutral-100 pt-5">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold uppercase tracking-widest text-black">
                  Option: <span className="font-semibold text-neutral-600">{selectedVariant.option1}</span>
                </label>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant.id === v.id;
                  const isSoldOut = v.inventoryQuantity <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`py-3 text-xs font-bold uppercase transition-all border relative ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : isSoldOut
                          ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-pointer'
                          : 'border-neutral-200 bg-white text-black hover:border-neutral-400'
                      }`}
                    >
                      <span>{v.option1}</span>
                      {isSoldOut && (
                        <span className="block text-[8px] font-normal text-neutral-400">Sold Out</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-neutral-500 mt-2 font-light">
                {selectedVariant.inventoryQuantity > 0 ? (
                  <>✓ In stock, ready to dispatch within 24 hours.</>
                ) : (
                  <span className="text-amber-700 font-medium">⚠ {selectedVariant.option1} is currently sold out.</span>
                )}
              </p>
            </div>
          ) : (
            <div className="border-t border-neutral-100 pt-4">
              <p className="text-xs text-neutral-600 font-light flex items-center space-x-1.5">
                {selectedVariant.inventoryQuantity > 0 ? (
                  <span className="text-emerald-700 font-medium">✓ In stock, ready to dispatch within 24 hours.</span>
                ) : (
                  <span className="text-amber-700 font-medium">⚠ Currently sold out.</span>
                )}
              </p>
            </div>
          )}

          {/* Quantity Stepper & Add to Cart */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold uppercase tracking-widest text-black">
                Quantity:
              </span>
              <div className="flex items-center border border-neutral-200">
                <button
                  type="button"
                  disabled={selectedVariant.inventoryQuantity <= 0}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-bold text-black min-w-[24px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={
                    selectedVariant.inventoryQuantity <= 0 ||
                    quantity >= selectedVariant.inventoryQuantity
                  }
                  onClick={() =>
                    setQuantity(Math.min(selectedVariant.inventoryQuantity, quantity + 1))
                  }
                  className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {quantity >= selectedVariant.inventoryQuantity &&
                selectedVariant.inventoryQuantity > 0 && (
                  <span className="text-[10px] text-amber-700 font-medium">
                    (Max available stock reached)
                  </span>
                )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                disabled={selectedVariant.inventoryQuantity <= 0}
                onClick={handleAddToCart}
                className="w-full py-4 bg-black text-white text-xs font-extrabold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors shadow-md disabled:bg-neutral-300 disabled:text-neutral-500 cursor-pointer disabled:cursor-not-allowed"
              >
                {selectedVariant.inventoryQuantity > 0 ? 'Add to Cart' : 'Sold Out'}
              </button>
              <button
                type="button"
                disabled={selectedVariant.inventoryQuantity <= 0}
                onClick={handleBuyItNow}
                className="w-full py-4 bg-neutral-100 text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors disabled:bg-neutral-100 disabled:text-neutral-400 cursor-pointer disabled:cursor-not-allowed"
              >
                {selectedVariant.inventoryQuantity > 0
                  ? 'Buy It Now (Cash on Delivery)'
                  : 'Currently Unavailable'}
              </button>
            </div>
          </div>

          {/* Delivery & Assurance Perks */}
          <div className="bg-neutral-50 p-4 border border-neutral-100 space-y-2 text-xs text-neutral-700">
            <div className="flex items-center space-x-2.5">
              <Truck className="w-4 h-4 text-black flex-shrink-0" />
              <span>
                <strong>Shipping all over Pakistan:</strong> 2-4 business days via courier.
              </span>
            </div>
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-black flex-shrink-0" />
              <span>
                <strong>Payment:</strong> Cash on delivery available nationwide.
              </span>
            </div>
          </div>

          {/* Collapsible Accordions (Horizon Theme Feature) */}
          <div className="border-t border-neutral-200 divide-y divide-neutral-200 text-xs">
            {/* Specifications & Craftsmanship */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('fit')}
                className="w-full py-4 flex justify-between items-center text-left font-bold uppercase tracking-wider text-black"
              >
                <span>Specifications & Craftsmanship</span>
                {openAccordion === 'fit' ? (
                  <ChevronUp className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                )}
              </button>
              {openAccordion === 'fit' && (
                <div className="pb-4 text-neutral-600 font-light space-y-2 animate-in fade-in duration-200">
                  <p>{product.description}</p>
                  <ul className="list-disc list-inside space-y-1 pt-1">
                    <li>Hand-forged premium high-carbon & Damascus steel construction</li>
                    <li>Razor-sharp hand-honed cutting edge with balanced weight distribution</li>
                    <li>Ergonomic hand-finished handle with reinforced guard & hardware</li>
                    <li>Protective sheath / presentation storage packaging included</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Shipping & Delivery */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('shipping')}
                className="w-full py-4 flex justify-between items-center text-left font-bold uppercase tracking-wider text-black"
              >
                <span>Shipping & Cash on Delivery</span>
                {openAccordion === 'shipping' ? (
                  <ChevronUp className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                )}
              </button>
              {openAccordion === 'shipping' && (
                <div className="pb-4 text-neutral-600 font-light space-y-2 animate-in fade-in duration-200">
                  <p>
                    All orders are securely packaged in tamper-evident protective transit boxes and dispatched within 24-48 hours via premium couriers.
                  </p>
                  <p>
                    Pay cash in hand when the courier delivers your parcel. Orders over Rs. 5,000 qualify for free nationwide shipping.
                  </p>
                </div>
              )}
            </div>

            {/* Care Instructions */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('care')}
                className="w-full py-4 flex justify-between items-center text-left font-bold uppercase tracking-wider text-black"
              >
                <span>Care & Maintenance</span>
                {openAccordion === 'care' ? (
                  <ChevronUp className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                )}
              </button>
              {openAccordion === 'care' && (
                <div className="pb-4 text-neutral-600 font-light space-y-1 animate-in fade-in duration-200">
                  <p>• Hand clean with warm water and mild soap immediately after use; dry thoroughly</p>
                  <p>• Never place fine blades in an automatic dishwasher</p>
                  <p>• Periodically apply a light coat of mineral blade oil to protect the steel finish</p>
                  <p>• Store in a dry environment inside the protective sheath</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* High-Resolution Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar with Title and Close Button */}
          <div className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between z-20 text-white">
            <div className="text-xs font-mono uppercase tracking-wider text-neutral-300 truncate max-w-[70vw]">
              {product.title} • Full High-Resolution View
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 bg-neutral-900/80 hover:bg-white hover:text-black rounded-full border border-neutral-700 text-white transition-colors cursor-pointer"
              title="Close Fullscreen (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Full-screen uncropped image */}
          <div
            className="relative w-full max-w-6xl max-h-[85vh] h-full flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage || product.featuredImage}
              alt={product.title}
              className="max-w-full max-h-[85vh] object-contain drop-shadow-2xl select-none"
            />
          </div>

          {/* Bottom Thumbnails Strip in Lightbox (if multiple images) */}
          {product.images.length > 1 && (
            <div
              className="absolute bottom-4 z-20 flex items-center space-x-2 bg-black/60 p-2 rounded-xs border border-neutral-800 overflow-x-auto max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-12 h-12 flex-shrink-0 border rounded-xs overflow-hidden transition-all bg-neutral-950 ${
                    selectedImage === img
                      ? 'border-white ring-1 ring-white opacity-100'
                      : 'border-neutral-700 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-contain p-0.5"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
