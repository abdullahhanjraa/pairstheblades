import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ArrowLeft } from 'lucide-react';
import { formatPKR } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let store: any = null;
  try {
    store = await prisma.store.findFirst();
  } catch (e) {
    console.error(e);
  }

  const storeName = store?.name || 'Pairs Knife & Sword Co.';
  const supportEmail = store?.supportEmail || 'support@pairsblades.com';
  const supportPhone = store?.supportPhone || '+92 300 1234567';
  const freeThreshold = store?.freeShippingThreshold ?? 5000.0;
  const shippingFee = store?.shippingFee ?? 250.0;
  const deliveryDays = store?.estimatedDeliveryDays || '2 to 4 business days';
  const communityLink = store?.communityLink || 'https://whatsapp.com/channel/0029Vb8BubO5K3zVoOAX9B0G';

  const getCustomOrFallback = (
    customText: string | null | undefined,
    fallbackArray: string[]
  ): string[] => {
    if (customText && customText.trim().length > 0) {
      return customText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }
    return fallbackArray;
  };

  const POLICIES: Record<string, { title: string; content: string[] }> = {
    'privacy-policy': {
      title: 'Privacy Policy',
      content: getCustomOrFallback(store?.policyPrivacy, [
        `At ${storeName}, we value your privacy. We only collect the minimal information necessary to deliver your cutlery and blade orders: name, shipping address, contact phone number, and optional email.`,
        'Your phone number is shared strictly with courier logistics partners (TCS, Trax, Call Courier) for the express purpose of parcel delivery dispatch, dispatch verification, and COD collection.',
        'We never sell or distribute your private contact details to third-party marketing brokers.',
      ]),
    },
    'refund-policy': {
      title: 'Refund & Quality Inspection Policy',
      content: getCustomOrFallback(store?.policyRefund, [
        'Every Damascus blade, knife, and sword undergoes rigorous edge alignment and inspection prior to dispatch.',
        'We offer a 7-day hassle-free inspection and replacement guarantee across Pakistan.',
        `If your blade arrives with manufacturing defects or transit damage, you can request an exchange or refund within 7 days of delivery.`,
        `Items must be in original condition with sheath, packaging, and edge protectors intact.`,
        `To initiate an exchange or claim, reach out to our WhatsApp support channel (${supportPhone}) with your Order Number and photos.`,
      ]),
    },
    'shipping-policy': {
      title: 'Shipping Policy',
      content: getCustomOrFallback(store?.policyShipping, [
        'All orders are processed and securely packaged within 24 to 48 hours from our workshop.',
        `Delivery time across Pakistan is typically ${deliveryDays} depending on city destination.`,
        `Free nationwide delivery is automatically applied to all orders above ${formatPKR(freeThreshold)}. For orders under ${formatPKR(freeThreshold)}, a standard courier fee of ${formatPKR(shippingFee)} is applied at checkout.`,
        'Cash on Delivery (COD) is available nationwide. Please have exact cash ready for the courier delivery rider.',
      ]),
    },
    'contact-information': {
      title: 'Contact Information',
      content: getCustomOrFallback(store?.policyContact, [
        `Have questions about blade steel, custom orders, or sheath options? We are here to help.`,
        `WhatsApp Community & Support: ${communityLink}`,
        `Support Phone: ${supportPhone}`,
        `Direct Email: ${supportEmail}`,
        'Operating Hours: Monday – Saturday, 10:00 AM – 7:00 PM (PKT).',
      ]),
    },
    'terms-of-service': {
      title: 'Terms of Service',
      content: getCustomOrFallback(store?.policyTerms, [
        `By placing an order on ${storeName}, you agree to these Terms of Service.`,
        'Prices are displayed in Pakistani Rupees (PKR) and include all applicable taxes.',
        'We reserve the right to verify Cash on Delivery orders via phone call or SMS before warehouse dispatch.',
        `All cutlery photos, blade specifications, and designs are intellectual property of ${storeName}.`,
      ]),
    },
  };

  const policy = POLICIES[slug] || {
    title: 'Terms & Policies',
    content: ['Please refer to our official terms and conditions.'],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-left">
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-black uppercase tracking-wider mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Store</span>
      </Link>

      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-black font-sans">
          {policy.title}
        </h1>

        <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed font-light">
          {policy.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
