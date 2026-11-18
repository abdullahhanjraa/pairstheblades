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

interface CurrencyContextValue {
  currency: CurrencyCode;
  detectedCurrency: CurrencyCode;
  rates: ExchangeRatesMap;
  isInternational: boolean;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (pkrAmount: number, overrideCurrency?: CurrencyCode) => string;
  convertAmount: (pkrAmount: number, overrideCurrency?: CurrencyCode) => number;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'PKR',
  detectedCurrency: 'PKR',
  rates: FALLBACK_RATES_FROM_PKR,
  isInternational: false,
  setCurrency: () => {},
  formatPrice: (amount) => formatMoney(amount, 'PKR', FALLBACK_RATES_FROM_PKR),
  convertAmount: (amount) => amount,
});

interface CurrencyProviderProps {
  initialCurrency: CurrencyCode;
  detectedCurrency: CurrencyCode;
  initialRates: ExchangeRatesMap;
  children: React.ReactNode;
}

export function CurrencyProvider({
  initialCurrency,
  detectedCurrency,
  initialRates,
  children,
}: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency);
  const rates = initialRates;

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    try {
      document.cookie = `${CURRENCY_COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      window.localStorage.setItem(CURRENCY_COOKIE_NAME, next);
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }, []);

  const formatPrice = useCallback(
    (pkrAmount: number, overrideCurrency?: CurrencyCode) => {
      return formatMoney(pkrAmount, overrideCurrency || currency, rates);
    },
    [currency, rates]
  );

  const convertAmount = useCallback(
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
      isInternational: currency !== 'PKR',
      setCurrency,
      formatPrice,
      convertAmount,
    }),
    [currency, detectedCurrency, rates, setCurrency, formatPrice, convertAmount]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
