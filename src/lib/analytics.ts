export type FunnelEventType =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'ADD_TO_CART'
  | 'CHECKOUT_START'
  | 'PURCHASE';

export interface TrackEventPayload {
  path?: string;
  productId?: string;
  contentName?: string;
  contentIds?: string[];
  value?: number;
  numItems?: number;
  orderNumber?: number | string;
  skipBeacon?: boolean;
}

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    ttq?: {
      page?: () => void;
      track?: (event: string, data?: Record<string, any>) => void;
    };
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Strict sanitizers prevent malformed or XSS pixel IDs from ever being saved or injected.
 */
export function sanitizeMetaPixelId(raw?: string | null): string {
  const clean = (raw || '').trim();
  return /^\d{5,25}$/.test(clean) ? clean : '';
}

export function sanitizeTikTokPixelId(raw?: string | null): string {
  const clean = (raw || '').trim();
  return /^[A-Za-z0-9_-]{5,40}$/.test(clean) ? clean : '';
}

export function sanitizeGa4Id(raw?: string | null): string {
  const clean = (raw || '').trim().toUpperCase();
  return /^G-[A-Z0-9]{4,20}$/.test(clean) ? clean : '';
}

const SESSION_KEY = 'pairs_analytics_sid';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let sid = window.sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return `s_${Date.now()}`;
  }
}

function sendFirstPartyBeacon(
  eventType: FunnelEventType,
  payload: TrackEventPayload
): void {
  if (typeof window === 'undefined') return;
  const path = payload.path || window.location.pathname;
  if (path.startsWith('/adminusman') || path.startsWith('/admin')) return;

  const body = JSON.stringify({
    sessionId: getOrCreateSessionId(),
    eventType,
    path: path.slice(0, 200),
    productId: payload.productId?.slice(0, 64),
    value: typeof payload.value === 'number' && Number.isFinite(payload.value) ? payload.value : undefined,
    meta: {
      contentName: payload.contentName?.slice(0, 120),
      numItems: payload.numItems,
      orderNumber: payload.orderNumber,
    },
  });

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
      return;
    }
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Non-blocking: never interrupt shopper UX
  }
}

function fireBrowserPixels(
  eventType: FunnelEventType,
  payload: TrackEventPayload
): void {
  if (typeof window === 'undefined') return;
  const value = typeof payload.value === 'number' ? payload.value : undefined;
  const contentIds =
    payload.contentIds && payload.contentIds.length > 0
      ? payload.contentIds
      : payload.productId
      ? [payload.productId]
      : undefined;

  try {
    // 1. Meta (Facebook & Instagram) Pixel
    if (typeof window.fbq === 'function') {
      if (eventType === 'PAGE_VIEW') {
        window.fbq('track', 'PageView');
      } else if (eventType === 'PRODUCT_VIEW') {
        window.fbq('track', 'ViewContent', {
          content_type: 'product',
          content_ids: contentIds,
          content_name: payload.contentName,
          value,
          currency: 'PKR',
        });
      } else if (eventType === 'ADD_TO_CART') {
        window.fbq('track', 'AddToCart', {
          content_type: 'product',
          content_ids: contentIds,
          content_name: payload.contentName,
          value,
          currency: 'PKR',
        });
      } else if (eventType === 'CHECKOUT_START') {
        window.fbq('track', 'InitiateCheckout', {
          content_ids: contentIds,
          num_items: payload.numItems,
          value,
          currency: 'PKR',
        });
      } else if (eventType === 'PURCHASE') {
        window.fbq('track', 'Purchase', {
          content_type: 'product',
          content_ids: contentIds,
          num_items: payload.numItems,
          value,
          currency: 'PKR',
        });
      }
    }

    // 2. TikTok Pixel
    if (window.ttq) {
      if (eventType === 'PAGE_VIEW' && typeof window.ttq.page === 'function') {
        window.ttq.page();
      } else if (typeof window.ttq.track === 'function') {
        const ttqMap: Record<Exclude<FunnelEventType, 'PAGE_VIEW'>, string> = {
          PRODUCT_VIEW: 'ViewContent',
          ADD_TO_CART: 'AddToCart',
          CHECKOUT_START: 'InitiateCheckout',
          PURCHASE: 'CompletePayment',
        };
        if (eventType !== 'PAGE_VIEW') {
          window.ttq.track(ttqMap[eventType], {
            content_type: 'product',
            content_id: contentIds?.[0],
            content_name: payload.contentName,
            quantity: payload.numItems,
            value,
            currency: 'PKR',
          });
        }
      }
    }

    // 3. Google Analytics 4 (gtag)
    if (typeof window.gtag === 'function') {
      if (eventType === 'PAGE_VIEW') {
        window.gtag('event', 'page_view', {
          page_path: payload.path || window.location.pathname,
        });
      } else if (eventType === 'PRODUCT_VIEW') {
        window.gtag('event', 'view_item', {
          currency: 'PKR',
          value,
          items: [
            {
              item_id: payload.productId,
              item_name: payload.contentName,
              price: value,
            },
          ],
        });
      } else if (eventType === 'ADD_TO_CART') {
        window.gtag('event', 'add_to_cart', {
          currency: 'PKR',
          value,
          items: [
            {
              item_id: payload.productId,
              item_name: payload.contentName,
              quantity: payload.numItems || 1,
            },
          ],
        });
      } else if (eventType === 'CHECKOUT_START') {
        window.gtag('event', 'begin_checkout', {
          currency: 'PKR',
          value,
        });
      } else if (eventType === 'PURCHASE') {
        window.gtag('event', 'purchase', {
          transaction_id: payload.orderNumber ? String(payload.orderNumber) : undefined,
          currency: 'PKR',
          value,
        });
      }
    }
  } catch {
    // Ignore third-party ad-blocker / pixel script errors safely
  }
}

/**
 * Fires unified storefront conversion tracking to:
 *  - Meta Pixel, TikTok Pixel, and GA4 (when configured in Admin Settings)
 *  - First-party Supabase Conversion Funnel via non-blocking sendBeacon
 */
export function trackStoreEvent(
  eventType: FunnelEventType,
  payload: TrackEventPayload = {}
): void {
  if (typeof window === 'undefined') return;
  const currentPath = payload.path || window.location.pathname;
  if (currentPath.startsWith('/adminusman') || currentPath.startsWith('/admin')) return;

  // Deduplicate Purchase events per orderNumber
  if (eventType === 'PURCHASE' && payload.orderNumber) {
    try {
      const dedupeKey = `pairs_tracked_purchase_${payload.orderNumber}`;
      if (window.sessionStorage.getItem(dedupeKey)) return;
      window.sessionStorage.setItem(dedupeKey, '1');
    } catch {
      // Proceed if sessionStorage is unavailable
    }
  }

  fireBrowserPixels(eventType, payload);
  if (!payload.skipBeacon) {
    sendFirstPartyBeacon(eventType, payload);
  }
}
