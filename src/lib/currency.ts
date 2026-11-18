export type CurrencyCode = 'PKR' | 'USD' | 'GBP' | 'EUR' | 'AED';

export const CURRENCY_COOKIE_NAME = 'pairs_currency';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  shortLabel: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['PKR', 'USD', 'GBP', 'EUR', 'AED'];

export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
  PKR: {
    code: 'PKR',
    symbol: 'Rs.',
    shortLabel: 'PKR',
    name: 'Pakistani Rupee',
    decimals: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    shortLabel: 'USD $',
    name: 'US Dollar',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    shortLabel: 'GBP £',
    name: 'British Pound',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    shortLabel: 'EUR €',
    name: 'Euro',
    decimals: 2,
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    shortLabel: 'AED',
    name: 'UAE Dirham',
    decimals: 0,
  },
};

export type ExchangeRatesMap = Record<CurrencyCode, number>;

/**
 * Safe fallback rates (1 PKR -> target currency) used only if the live
 * daily rate feed is temporarily unreachable.
 */
export const FALLBACK_RATES_FROM_PKR: ExchangeRatesMap = {
  PKR: 1,
  USD: 0.00361,
  GBP: 0.00274,
  EUR: 0.00329,
  AED: 0.01328,
};

const EUROZONE_COUNTRIES = new Set([
  'AT',
  'BE',
  'CY',
  'DE',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PT',
  'SI',
  'SK',
]);

export function isValidCurrency(value?: string | null): value is CurrencyCode {
  if (!value) return false;
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value.toUpperCase());
}

export function normalizeCurrencyCode(value?: string | null): CurrencyCode | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  return isValidCurrency(upper) ? upper : null;
}

/**
 * Maps ISO 3166-1 alpha-2 country code (from Vercel's `x-vercel-ip-country` edge header)
 * to the visitor's most natural currency.
 */
export function detectCurrencyFromCountry(countryCode?: string | null): CurrencyCode {
  if (!countryCode || !countryCode.trim()) return 'PKR';
  const code = countryCode.trim().toUpperCase();
  if (code === 'PK') return 'PKR';
  if (code === 'GB') return 'GBP';
  if (code === 'AE') return 'AED';
  if (EUROZONE_COUNTRIES.has(code)) return 'EUR';
  return 'USD';
}

export function convertFromPKR(
  pkrAmount: number,
  currency: CurrencyCode,
  rates: ExchangeRatesMap
): number {
  const safeAmount = Number.isFinite(pkrAmount) ? pkrAmount : 0;
  if (currency === 'PKR') return safeAmount;
  const rate = rates[currency] ?? FALLBACK_RATES_FROM_PKR[currency] ?? 1;
  const converted = safeAmount * rate;
  const decimals = CURRENCY_CONFIG[currency].decimals;
  const factor = Math.pow(10, decimals);
  return Math.round(converted * factor) / factor;
}

/**
 * Formats a base PKR amount into the buyer's active currency cleanly.
 */
export function formatMoney(
  pkrAmount: number,
  currency: CurrencyCode,
  rates: ExchangeRatesMap
): string {
  const safeAmount = Number.isFinite(pkrAmount) ? pkrAmount : 0;

  if (currency === 'PKR') {
    const rounded = Math.round(safeAmount);
    return `Rs. ${rounded.toLocaleString('en-PK')}`;
  }

  const converted = convertFromPKR(safeAmount, currency, rates);
  const cfg = CURRENCY_CONFIG[currency];

  const formattedNum = converted.toLocaleString('en-US', {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });

  return `${cfg.symbol}${formattedNum}`;
}
