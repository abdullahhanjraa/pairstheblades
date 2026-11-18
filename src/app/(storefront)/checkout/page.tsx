import React from 'react';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { CheckoutClient, type CheckoutStoreSettings } from './checkout-client';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const [s, headerStore] = await Promise.all([
    prisma.store
      .findFirst({ orderBy: { createdAt: 'asc' } })
      .catch((err) => {
        console.error('Error loading store settings in CheckoutPage:', err);
        return null;
      }),
    headers(),
  ]);

  const detectedCountry =
    headerStore.get('x-vercel-ip-country') || headerStore.get('cf-ipcountry') || null;

  const initialStoreSettings: CheckoutStoreSettings = {
    storeName: s?.name || 'Pairs Blades',
    logoText: s?.logoText || 'PAIRS',
    detectedCountry: detectedCountry ? detectedCountry.toUpperCase() : null,
    freeShippingThreshold: Number(s?.freeShippingThreshold) || 5000.0,
    shippingFee: Number(s?.shippingFee) || 250.0,
    estimatedDeliveryDays: s?.estimatedDeliveryDays || '2-4 Business Days',
    internationalShippingFee:
      s?.internationalShippingFee !== undefined && s?.internationalShippingFee !== null
        ? Number(s.internationalShippingFee)
        : 7000.0,
    internationalDeliveryDays:
      s?.internationalDeliveryDays || '5-9 Business Days (DHL / FedEx)',
    internationalMarkupPercent:
      s?.internationalMarkupPercent !== undefined && s?.internationalMarkupPercent !== null
        ? Number(s.internationalMarkupPercent)
        : 25.0,
    enableCod: s?.enableCod !== undefined ? Boolean(s.enableCod) : true,
    enableCard: s?.enableCard !== undefined ? Boolean(s.enableCard) : true,
    codNotice:
      s?.codNotice || 'Pay with cash upon delivery at your doorstep anywhere in Pakistan.',
    enableBankTransfer:
      s?.enableBankTransfer !== undefined ? Boolean(s.enableBankTransfer) : true,
    bankName: s?.bankName || 'Meezan Bank Ltd',
    bankAccountTitle: s?.bankAccountTitle || 'PAIRS KNIFE & SWORD CO.',
    bankAccountNumber: s?.bankAccountNumber || '01020304050607',
    bankIban: s?.bankIban || 'PK36MEZN0001020304050607',
    bankBranch: s?.bankBranch || 'Main Boulevard, Gujranwala',
    bankInstructions:
      s?.bankInstructions ||
      'Please transfer total amount via Raast / Online Banking and WhatsApp receipt with Order # to support.',
    enablePayoneer: s?.enablePayoneer !== undefined ? Boolean(s.enablePayoneer) : true,
    payoneerTitle: s?.payoneerTitle || 'Payoneer (International Payment)',
    payoneerEmail: s?.payoneerEmail || '',
    payoneerAccountHolder: s?.payoneerAccountHolder || '',
    payoneerBankName: s?.payoneerBankName || '',
    payoneerAccountNumber: s?.payoneerAccountNumber || '',
    payoneerRoutingNumber: s?.payoneerRoutingNumber || '',
    payoneerCurrency: s?.payoneerCurrency || 'USD',
    payoneerPayLink: s?.payoneerPayLink || '',
    payoneerInstructions:
      s?.payoneerInstructions ||
      'Send payment to our Payoneer account above and share your receipt with your Order # via WhatsApp or Email.',
    enableInternationalTransfer:
      s?.enableInternationalTransfer !== undefined
        ? Boolean(s.enableInternationalTransfer)
        : true,
    internationalTitle: s?.internationalTitle || 'International Transfer (PayPal / Wise)',
    payoneerAccount: s?.payoneerAccount || '',
    paypalAccount: s?.paypalAccount || '',
    wiseAccount: s?.wiseAccount || '',
    internationalInstructions:
      s?.internationalInstructions ||
      'Transfer your order total via PayPal or Wise and share your payment receipt with Order # via WhatsApp or Email.',
    supportPhone: s?.supportPhone || '+92 300 1234567',
    whatsappNumber: s?.whatsappNumber || s?.supportPhone || '+92 300 1234567',
    supportEmail: s?.supportEmail || 'support@pairstheblades.com',
    cardGatewayName: s?.cardGatewayName || 'Visa / Mastercard Secure Gateway',
    cardInstructions:
      s?.cardInstructions || 'Instant checkout via 3D Secure card processing sandbox.',
    cardMode: s?.cardMode || 'SANDBOX',
  };

  return <CheckoutClient initialStoreSettings={initialStoreSettings} />;
}
