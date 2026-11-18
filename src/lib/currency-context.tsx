'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  CURRENCY_COOKIE_NAME,
  FALLBACK_RATES_FROM_PKR,
  convertFromPKR,
  formatMoney,
  type CurrencyCode,
  type ExchangeRatesMap,
} from '@/lib/currency';
import { applyZoneUnitPrice, clampMarkupPercent } from '@/lib/pricing-zone';

interface CurrencyContextValue {
  currency: CurrencyCode;
  detectedCurrency: CurrencyCode;
  rates: ExchangeRatesMap;
  isInternational: boolean;
  internationalMarkupPercent: number;
  setCurrency: (code: CurrencyCode) => void;
  /** Returns base PKR price adjusted for active zone (applies international markup if overseas). */
  getAdjustedUnitPrice: (basePkrPrice: number) => number;
  /** Formats a catalog product PKR price (automatically applies international margin when overseas). */
  formatPrice: (basePkrPrice: number, overrideCurrency?: CurrencyCode) => string;
  /** Formats an already-adjusted PKR amount (shipping fees, already-adjusted subtotals/totals) without applying product markup again. */
  formatRawPrice: (pkrAmount: number, overrideCurrency?: CurrencyCode) => string;
  /** Converts an already-adjusted PKR amount into numeric target currency without double-markup. */
  convertRawAmount: (pkrAmount: number, overrideCurrency?: CurrencyCode) => number;
  /** Alias for convertRawAmount kept for convenience. */
  convertAmount: (pkrAmount: number, overrideCurrency?: CurrencyCode) => number;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'PKR',
  detectedCurrency: 'PKR',
  rates: FALLBACK_RATES_FROM_PKR,
  isInternational: false,
  internationalMarkupPercent: 0,
  setCurrency: () => {},
  getAdjustedUnitPrice: (amount) => amount,
  formatPrice: (amount) => formatMoney(amount, 'PKR', FALLBACK_RATES_FROM_PKR),
  formatRawPrice: (amount) => formatMoney(amount, 'PKR', FALLBACK_RATES_FROM_PKR),
  convertRawAmount: (amount) => amount,
  convertAmount: (amount) => amount,
});

interface CurrencyProviderProps {
  initialCurrency: CurrencyCode;
  detectedCurrency: CurrencyCode;
  initialRates: ExchangeRatesMap;
  internationalMarkupPercent?: number;
  children: React.ReactNode;
}

export function CurrencyProvider({
  initialCurrency,
  detectedCurrency,
  initialRates,
  internationalMarkupPercent = 0,
  children,
}: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency);
  const rates = initialRates;
  const safeMarkup = clampMarkupPercent(internationalMarkupPercent);
  const isInternational = currency !== 'PKR';

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    try {
      document.cookie = `${CURRENCY_COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      window.localStorage.setItem(CURRENCY_COOKIE_NAME, next);
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }, []);

  const getAdjustedUnitPrice = useCallback(
    (basePkrPrice: number) => {
      return applyZoneUnitPrice(
        basePkrPrice,
        isInternational ? 'INTERNATIONAL' : 'DOMESTIC',
        safeMarkup
      );
    },
    [isInternational, safeMarkup]
  );

  const formatPrice = useCallback(
    (basePkrPrice: number, overrideCurrency?: CurrencyCode) => {
      const target = overrideCurrency || currency;
      const adjusted = applyZoneUnitPrice(
        basePkrPrice,
        target !== 'PKR' ? 'INTERNATIONAL' : 'DOMESTIC',
        safeMarkup
      );
      return formatMoney(adjusted, target, rates);
    },
    [currency, rates, safeMarkup]
  );

  const formatRawPrice = useCallback(
    (pkrAmount: number, overrideCurrency?: CurrencyCode) => {
      return formatMoney(pkrAmount, overrideCurrency || currency, rates);
    },
    [currency, rates]
  );

  const convertRawAmount = useCallback(
    (pkrAmount: number, overrideCurrency?: CurrencyCode) => {
      return convertFromPKR(pkrAmount, overrideCurrency || currency, rates);
    },
    [currency, rates]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      detectedCurrency,
      rates,
      isInternational,
      internationalMarkupPercent: safeMarkup,
      setCurrency,
      getAdjustedUnitPrice,
      formatPrice,
      formatRawPrice,
      convertRawAmount,
      convertAmount: convertRawAmount,
    }),
    [
      currency,
      detectedCurrency,
      rates,
      isInternational,
      safeMarkup,
      setCurrency,
      getAdjustedUnitPrice,
      formatPrice,
      formatRawPrice,
      convertRawAmount,
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
