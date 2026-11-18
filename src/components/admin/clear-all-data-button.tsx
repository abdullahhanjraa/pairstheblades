'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Check } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

export function ClearAllDataButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [doneNotice, setDoneNotice] = useState(false);

  const handleConfirmClear = async () => {
    setIsClearing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/reset-test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'RESET' }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setIsOpen(false);
        setDoneNotice(true);
        router.refresh();
        setTimeout(() => setDoneNotice(false), 4500);
      } else {
        setErrorMsg(data.error || 'Could not clear store data. Please try again.');
      }
    } catch {
      setErrorMsg('Network error while clearing store data.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {doneNotice && (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Store data cleared</span>
          </span>
        )}
        {errorMsg && (
          <span className="text-[11px] font-medium text-red-600">{errorMsg}</span>
        )}

        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setIsOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-neutral-300 text-neutral-700 text-xs font-semibold hover:border-red-300 hover:text-red-700 hover:bg-red-50/50 transition-colors cursor-pointer"
          title="Clear all orders, revenue, and analytics for a fresh start"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Data</span>
        </button>
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        title="Clear All Data (Fresh Start)"
        message="This permanently clears all Orders, Revenue history, Top Cities, Conversion Funnel visits, Product views/carts, and coupon usage counts so the store starts fresh at Rs. 0. Your Products, Photos, Stock, Store Settings, Pixels, and Admin Password stay 100% safe and untouched."
        confirmText="Clear All Data"
        cancelText="Cancel"
        variant="danger"
        requiredConfirmationText="RESET"
        isLoading={isClearing}
        onConfirm={handleConfirmClear}
        onClose={() => {
          if (!isClearing) setIsOpen(false);
        }}
      />
    </>
  );
}
