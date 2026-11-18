import type { CurrencyCode } from '@/lib/currency';

export type PricingZone = 'DOMESTIC' | 'INTERNATIONAL';

const PAKISTAN_DESTINATIONS = new Set([
  'punjab',
  'sindh',
  'khyber pakhtunkhwa',
  'kpk',
  'balochistan',
  'islamabad',
  'islamabad capital territory',
  'ict',
  'azad kashmir',
  'ajk',
  'gilgit-baltistan',
  'gilgit baltistan',
  'gb',
  'pakistan',
  'pk',
]);

/**
 * Checks whether a province / state / country string refers to Pakistan.
 */
export function isPakistanDestination(provinceOrCountry?: string | null): boolean {
  if (!provinceOrCountry || !provinceOrCountry.trim()) return false;
  const normalized = provinceOrCountry.trim().toLowerCase();
  if (PAKISTAN_DESTINATIONS.has(normalized)) return true;
  if (normalized.includes('pakistan')) return true;
  return false;
}

/**
 * Single source of truth for resolving Domestic (Pakistan) vs. International (Worldwide)
 * shipping & pricing zone across both Checkout UI and authoritative `POST /api/checkout`.
 */
export function resolveCheckoutPricingZone(params: {
  countryCode?: string | null;
  currency?: CurrencyCode | string | null;
  province?: string | null;
  paymentMethod?: string | null;
}): PricingZone {
  const provinceText = (params.province || '').trim();
  const method = (params.paymentMethod || '').toUpperCase();
  const currency = (params.currency || 'PKR').toUpperCase();
  const country = (params.countryCode || '').trim().toUpperCase();

  // 1. Explicit non-Pakistan shipping destination ALWAYS triggers International zone
  if (provinceText && !isPakistanDestination(provinceText)) {
    return 'INTERNATIONAL';
  }

  // 2. Explicit Pakistan province selected with local payment -> Domestic zone
  if (provinceText && isPakistanDestination(provinceText)) {
    if (method === 'COD' || method === 'BANK_TRANSFER') {
      return 'DOMESTIC';
    }
  }

  // 3. International payment method or foreign currency -> International zone
  if (method === 'PAYONEER' || method === 'INTERNATIONAL_TRANSFER') {
    if (!provinceText || !isPakistanDestination(provinceText)) {
      return 'INTERNATIONAL';
    }
    // Even if province is still default 'Punjab' before buyer typed their country,
    // if they are shopping in a foreign currency or outside PK, treat as International
    if (currency !== 'PKR' || (country && country !== 'PK')) {
      return 'INTERNATIONAL';
    }
  }

  // 4. Foreign currency or non-PK edge country
  if (currency !== 'PKR') return 'INTERNATIONAL';
  if (country && country !== 'PK') return 'INTERNATIONAL';

  return 'DOMESTIC';
}

export function clampMarkupPercent(raw?: number | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(200, Math.max(0, n));
}

/**
 * Applies the store's optional International Price Adjustment (%) cleanly on base PKR unit prices.
 * Domestic buyers always pay the exact base PKR catalog price.
 */
export function applyZoneUnitPrice(
  basePkrPrice: number,
  zone: PricingZone,
  internationalMarkupPercent = 0
): number {
  const safeBase = Number.isFinite(basePkrPrice) ? basePkrPrice : 0;
  if (zone !== 'INTERNATIONAL') return safeBase;
  const pct = clampMarkupPercent(internationalMarkupPercent);
  if (pct === 0) return safeBase;
  return Math.round(safeBase * (1 + pct / 100));
}

export interface ZoneShippingConfig {
  domesticFee: number;
  domesticFreeThreshold: number;
  domesticDeliveryDays: string;
  internationalFee: number;
  internationalDeliveryDays: string;
}

export interface ZoneShippingResult {
  zone: PricingZone;
  shippingFee: number;
  qualifiesForFree: boolean;
  deliveryLabel: string;
  carrierLabel: string;
}

/**
 * Calculates authoritative shipping fee for Domestic vs. International orders.
 * International orders NEVER receive free shipping — they always pay `internationalFee`.
 */
export function calculateZoneShipping(
  zoneSubtotalPkr: number,
  zone: PricingZone,
  config: ZoneShippingConfig
): ZoneShippingResult {
  if (zone === 'INTERNATIONAL') {
    const intlFee = Math.max(0, Number(config.internationalFee) || 0);
    return {
      zone: 'INTERNATIONAL',
      shippingFee: zoneSubtotalPkr <= 0 ? 0 : intlFee,
      qualifiesForFree: false,
      deliveryLabel: config.internationalDeliveryDays || '5-9 Business Days (DHL / FedEx)',
      carrierLabel: 'Worldwide Express (DHL / FedEx)',
    };
  }

  const domFee = Math.max(0, Number(config.domesticFee) || 0);
  const threshold = Math.max(0, Number(config.domesticFreeThreshold) || 0);
  const qualifiesForFree =
    zoneSubtotalPkr <= 0 || (threshold > 0 && zoneSubtotalPkr >= threshold);

  return {
    zone: 'DOMESTIC',
    shippingFee: qualifiesForFree ? 0 : domFee,
    qualifiesForFree,
    deliveryLabel: config.domesticDeliveryDays || '2-4 Business Days',
    carrierLabel: 'Nationwide Shipping',
  };
}
