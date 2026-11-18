import React from 'react';
import { prisma } from '@/lib/db';
import { maskWhatsAppAgentToken } from '@/lib/whatsapp-agent';
import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  let store: any = null;
  let discounts: any[] = [];
  let hasCustomPassword = false;
  let whatsappAgentStatus = {
    connected: false,
    enabled: false,
    userName: null as string | null,
    maskedToken: null as string | null,
  };

  try {
    const rawStore = await prisma.store.findFirst({ orderBy: { createdAt: 'asc' } });
    if (rawStore) {
      hasCustomPassword = Boolean(rawStore.adminPasskeyHash);
      whatsappAgentStatus = {
        connected: Boolean(rawStore.whatsappAgentToken && rawStore.whatsappAgentRecipientId),
        enabled: Boolean(rawStore.whatsappAgentEnabled),
        userName: rawStore.whatsappAgentUserName ?? null,
        maskedToken: maskWhatsAppAgentToken(rawStore.whatsappAgentToken),
      };
      const {
        adminPasskeyHash: _hidden,
        adminSessionVersion: _ver,
        whatsappAgentToken: _waToken,
        whatsappAgentRecipientId: _waRecipient,
        ...safeStore
      } = rawStore;
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
          Master control panel: customize live homepage banners, delivery rates, payment gateways, coupons, WhatsApp order alerts, and security password.
        </p>
      </div>

      <SettingsForm
        initialStore={store}
        initialDiscounts={discounts}
        initialHasCustomPassword={hasCustomPassword}
        initialWhatsAppAgentStatus={whatsappAgentStatus}
      />
    </div>
  );
}
