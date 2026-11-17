import React from 'react';
import { prisma } from '@/lib/db';
import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  let store: any = null;
  let discounts: any[] = [];

  try {
    store = await prisma.store.findFirst();
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
          Master control panel: customize live homepage banners, delivery rates, payment gateways, and coupons.
        </p>
      </div>

      <SettingsForm initialStore={store} initialDiscounts={discounts} />
    </div>
  );
}
