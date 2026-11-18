import React from 'react';
import { prisma } from '@/lib/db';
import { resolveRequestCurrency } from '@/lib/currency-server';
import { CurrencyProvider } from '@/lib/currency-context';
import { AnnouncementBar } from '@/components/storefront/announcement-bar';
import { Navbar } from '@/components/storefront/navbar';
import { CartDrawer } from '@/components/storefront/cart-drawer';
import { Footer } from '@/components/storefront/footer';
import { FloatingWhatsApp } from '@/components/storefront/floating-whatsapp';
import { TrackingPixels } from '@/components/storefront/tracking-pixels';

export const dynamic = 'force-dynamic';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let store: any = null;

  const [storeResult, currencyState] = await Promise.all([
    prisma.store
      .findFirst({ orderBy: { createdAt: 'asc' } })
      .catch((e) => {
        console.error('Error loading store in StorefrontLayout:', e);
        return null;
      }),
    resolveRequestCurrency(),
  ]);
  store = storeResult;

  const enableAnnouncement = store?.enableAnnouncement ?? true;
  const announcement =
    store?.announcement ||
    'Nationwide Cash on Delivery across Pakistan. Handcrafted Damascus blades, chef knives, and swords.';
  const logoText = store?.logoText || 'PAIRS';
  const freeShippingThreshold = store?.freeShippingThreshold ?? 5000.0;
  const shippingFee = store?.shippingFee ?? 250.0;

  // Granular Social Toggles
  const enableSocialLinks = store?.enableSocialLinks ?? true;
  const enableInstagram = store?.enableInstagram ?? true;
  const enableTiktok = store?.enableTiktok ?? true;
  const enableYoutube = store?.enableYoutube ?? true;
  const enableWhatsApp = store?.enableWhatsApp ?? true;
  const enableFloatingWhatsApp = store?.enableFloatingWhatsApp ?? true;
  const whatsappNumber = store?.whatsappNumber || store?.supportPhone || '+923001234567';
  const whatsappDefaultMsg =
    store?.whatsappDefaultMsg ||
    'Hi Pairs Cutlery, I would like to inquire about handcrafted blades.';

  const instagramUrl = store?.instagramUrl || 'https://www.instagram.com/pairs.clo';
  const tiktokUrl = store?.tiktokUrl || 'https://www.tiktok.com/@cinem4tographyyy';
  const youtubeUrl = store?.youtubeUrl || 'https://youtube.com/@cinem4tography';
  const legalName = store?.name || 'Pairs Knife & Sword Co.';

  return (
    <CurrencyProvider
      initialCurrency={currencyState.currency}
      detectedCurrency={currencyState.detectedCurrency}
      initialRates={currencyState.rates}
    >
      <div className="flex flex-col min-h-screen">
        <AnnouncementBar text={announcement} enabled={enableAnnouncement} />
        <Navbar logoText={logoText} />
        <CartDrawer
          freeShippingThreshold={freeShippingThreshold}
          shippingFee={shippingFee}
        />
        <main className="flex-1">{children}</main>
        <Footer
          logoText={logoText}
          enableSocialLinks={enableSocialLinks}
          enableInstagram={enableInstagram}
          enableTiktok={enableTiktok}
          enableYoutube={enableYoutube}
          enableWhatsApp={enableWhatsApp}
          whatsappNumber={whatsappNumber}
          instagramUrl={instagramUrl}
          tiktokUrl={tiktokUrl}
          youtubeUrl={youtubeUrl}
          legalName={legalName}
        />

        {/* Floating Customer Support WhatsApp Widget */}
        <FloatingWhatsApp
          phone={whatsappNumber}
          defaultMessage={whatsappDefaultMsg}
          enabled={enableFloatingWhatsApp && enableSocialLinks}
        />

        {/* Marketing Pixels (Meta, TikTok, GA4) & Conversion Funnel Beacon */}
        <TrackingPixels
          metaPixelId={store?.metaPixelId}
          tiktokPixelId={store?.tiktokPixelId}
          ga4MeasurementId={store?.ga4MeasurementId}
        />
      </div>
    </CurrencyProvider>
  );
}
