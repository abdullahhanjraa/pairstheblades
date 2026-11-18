import { cookies, headers } from 'next/headers';
import {
  CURRENCY_COOKIE_NAME,
  FALLBACK_RATES_FROM_PKR,
  detectCurrencyFromCountry,
  normalizeCurrencyCode,
  type CurrencyCode,
  type ExchangeRatesMap,
} from '@/lib/currency';

export interface ResolvedCurrencyState {
  currency: CurrencyCode;
  detectedCurrency: CurrencyCode;
  detectedCountry: string | null;
  rates: ExchangeRatesMap;
  ratesSource: 'live' | 'fallback';
}

/**
 * Fetches live daily PKR conversion rates from open.er-api.com (free, zero API key).
 * Cached for 6 hours via Next.js fetch cache with a strict 2.5s abort timeout so
 * storefront SSR is never blocked by external latency.
 */
export async function getLiveExchangeRates(): Promise<{
  rates: ExchangeRatesMap;
  source: 'live' | 'fallback';
}> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/PKR', {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) {
      return { rates: { ...FALLBACK_RATES_FROM_PKR }, source: 'fallback' };
    }

    const data = await res.json().catch(() => null);
    const r = data?.rates;

    if (
      data?.result === 'success' &&
      r &&
      typeof r.USD === 'number' &&
      r.USD > 0 &&
      typeof r.GBP === 'number' &&
      r.GBP > 0 &&
      typeof r.EUR === 'number' &&
      r.EUR > 0 &&
      typeof r.AED === 'number' &&
      r.AED > 0
    ) {
      return {
        rates: {
          PKR: 1,
          USD: r.USD,
          GBP: r.GBP,
          EUR: r.EUR,
          AED: r.AED,
        },
        source: 'live',
      };
    }
  } catch {
    // Gracefully fall back to safe cached rates
  }

  return { rates: { ...FALLBACK_RATES_FROM_PKR }, source: 'fallback' };
}

/**
 * Resolves the visitor's currency on the server (0ms flicker on first paint):
 * 1. Explicit `pairs_currency` cookie (if visitor manually chose a currency)
 * 2. Automatic Vercel edge country header (`x-vercel-ip-country` / `cf-ipcountry`)
 */
export async function resolveRequestCurrency(): Promise<ResolvedCurrencyState> {
  const [headerStore, cookieStore, rateResult] = await Promise.all([
    headers(),
    cookies(),
    getLiveExchangeRates(),
  ]);

  const rawCountry =
    headerStore.get('x-vercel-ip-country') ||
    headerStore.get('cf-ipcountry') ||
    null;

  const detectedCurrency = detectCurrencyFromCountry(rawCountry);
  const savedCookie = normalizeCurrencyCode(cookieStore.get(CURRENCY_COOKIE_NAME)?.value);

  return {
    currency: savedCookie || detectedCurrency,
    detectedCurrency,
    detectedCountry: rawCountry ? rawCountry.toUpperCase() : null,
    rates: rateResult.rates,
    ratesSource: rateResult.source,
  };
}
