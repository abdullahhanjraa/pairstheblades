'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import {
  sanitizeMetaPixelId,
  sanitizeTikTokPixelId,
  sanitizeGa4Id,
  trackStoreEvent,
} from '@/lib/analytics';

interface TrackingPixelsProps {
  metaPixelId?: string | null;
  tiktokPixelId?: string | null;
  ga4MeasurementId?: string | null;
}

export function TrackingPixels({
  metaPixelId,
  tiktokPixelId,
  ga4MeasurementId,
}: TrackingPixelsProps) {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);

  const cleanMetaId = sanitizeMetaPixelId(metaPixelId);
  const cleanTikTokId = sanitizeTikTokPixelId(tiktokPixelId);
  const cleanGa4Id = sanitizeGa4Id(ga4MeasurementId);

  // Track PageView on every client route navigation (including initial landing)
  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/adminusman') || pathname.startsWith('/admin')) return;
    if (lastTrackedPathRef.current === pathname) return;

    lastTrackedPathRef.current = pathname;
    trackStoreEvent('PAGE_VIEW', { path: pathname });
  }, [pathname]);

  return (
    <>
      {/* Meta (Facebook & Instagram) Pixel */}
      {cleanMetaId && (
        <Script id="pairs-meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${cleanMetaId}');fbq('track','PageView');`}
        </Script>
      )}

      {/* TikTok Pixel */}
      {cleanTikTokId && (
        <Script id="pairs-tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var s=d.createElement("script");s.type="text/javascript";s.async=!0;s.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a)};ttq.load('${cleanTikTokId}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}

      {/* Google Analytics 4 */}
      {cleanGa4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${cleanGa4Id}`}
            strategy="afterInteractive"
          />
          <Script id="pairs-ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${cleanGa4Id}');`}
          </Script>
        </>
      )}
    </>
  );
}
