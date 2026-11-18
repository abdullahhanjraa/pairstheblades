'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useCurrency } from '@/lib/currency-context';
import {
  CURRENCY_CONFIG,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from '@/lib/currency';

interface CurrencySwitcherProps {
  variant?: 'header' | 'mobile';
  onSelect?: () => void;
}

export function CurrencySwitcher({ variant = 'header', onSelect }: CurrencySwitcherProps) {
  const { currency, detectedCurrency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleChoose = (code: CurrencyCode) => {
    setCurrency(code);
    setOpen(false);
    onSelect?.();
  };

  if (variant === 'mobile') {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          <Globe className="w-3.5 h-3.5" />
          <span>Currency</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SUPPORTED_CURRENCIES.map((code) => {
            const cfg = CURRENCY_CONFIG[code];
            const isActive = currency === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleChoose(code)}
                className={`px-2.5 py-2 text-[11px] font-semibold tracking-wider border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                }`}
              >
                {cfg.shortLabel}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const activeCfg = CURRENCY_CONFIG[currency];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center space-x-1 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-800 hover:text-black border border-transparent hover:border-neutral-200 transition-colors cursor-pointer"
        aria-label="Select currency"
        aria-expanded={open}
      >
        <Globe className="w-3.5 h-3.5 text-neutral-500 hidden sm:inline" />
        <span>{activeCfg.shortLabel}</span>
        <ChevronDown
          className={`w-3 h-3 text-neutral-400 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 border-b border-neutral-100 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Select Currency
          </div>
          {SUPPORTED_CURRENCIES.map((code) => {
            const cfg = CURRENCY_CONFIG[code];
            const isActive = currency === code;
            const isAuto = detectedCurrency === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleChoose(code)}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-neutral-50 text-black font-semibold'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-black'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] font-bold w-8 text-black">
                    {code}
                  </span>
                  <span className="text-[11px] text-neutral-500">{cfg.name}</span>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  {isAuto && !isActive && (
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-medium">
                      Auto
                    </span>
                  )}
                  {isActive && <Check className="w-3.5 h-3.5 text-black" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
