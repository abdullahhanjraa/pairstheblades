import React from 'react';
import { prisma } from '@/lib/db';
import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  let store: any = null;
  let discounts: any[] = [];
  let hasCustomPassword = false;

  try {
    const rawStore = await prisma.store.findFirst();
    if (rawStore) {
      hasCustomPassword = Boolean(rawStore.adminPasskeyHash);
      const { adminPasskeyHash: _hidden, ...safeStore } = rawStore;
      store = safeStore;
    }
    discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (e) {
    console.error('Error fetching admin settings:', e);
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-black font-sans">
          Store & Platform Settings
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Master control panel: customize live homepage banners, delivery rates, payment gateways, coupons, and security password.
        </p>
      </div>

      <SettingsForm
        initialStore={store}
        initialDiscounts={discounts}
        initialHasCustomPassword={hasCustomPassword}
      />
    </div>
  );
}
