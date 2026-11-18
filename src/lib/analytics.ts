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

const SESSION_STORAGE_KEY = 'pairs_analytics_session_v2';
const DEDUPE_STORAGE_KEY = 'pairs_analytics_sent_v2';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30-minute sliding cross-tab session (Shopify/GA4 standard)

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Cross-tab 30-minute sliding session stored in localStorage so opening multiple tabs
 * in the same browser counts as 1 honest shopper visit instead of inflated duplicates.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  const now = Date.now();
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string; lastSeen?: number };
      if (parsed?.id && typeof parsed.lastSeen === 'number' && now - parsed.lastSeen < SESSION_TIMEOUT_MS) {
        window.localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({ id: parsed.id, lastSeen: now })
        );
        return parsed.id;
      }
    }
    const freshId = generateSessionId();
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ id: freshId, lastSeen: now })
    );
    // New session starts with a fresh dedupe bucket
    window.localStorage.removeItem(DEDUPE_STORAGE_KEY);
    return freshId;
  } catch {
    return generateSessionId();
  }
}

/**
 * Prevents redundant identical DB writes within the same 30-minute session
 * (e.g. refreshing the homepage 5 times writes 1 clean PAGE_VIEW instead of 5).
 */
function shouldSendFirstPartyBeacon(
  sessionId: string,
  eventType: FunnelEventType,
  dedupeTarget: string
): boolean {
  if (eventType === 'PURCHASE') return true;
  try {
    const raw = window.localStorage.getItem(DEDUPE_STORAGE_KEY);
    const cache: { sid?: string; keys?: string[] } = raw ? JSON.parse(raw) : {};
    const keys = cache.sid === sessionId && Array.isArray(cache.keys) ? cache.keys : [];
    const compositeKey = `${eventType}:${dedupeTarget}`;
    if (keys.includes(compositeKey)) {
      return false;
    }
    const nextKeys = [...keys.slice(-60), compositeKey];
    window.localStorage.setItem(
      DEDUPE_STORAGE_KEY,
      JSON.stringify({ sid: sessionId, keys: nextKeys })
    );
    return true;
  } catch {
    return true;
  }
}

function sendFirstPartyBeacon(
  eventType: FunnelEventType,
  payload: TrackEventPayload
): void {
  if (typeof window === 'undefined') return;
  const path = payload.path || window.location.pathname;
  if (path.startsWith('/adminusman') || path.startsWith('/admin')) return;

  const sessionId = getOrCreateSessionId();
  const dedupeTarget =
    eventType === 'PRODUCT_VIEW'
      ? payload.productId || path
      : eventType === 'ADD_TO_CART'
      ? payload.productId || 'cart'
      : eventType === 'CHECKOUT_START'
      ? 'checkout'
      : path;

  if (!shouldSendFirstPartyBeacon(sessionId, eventType, dedupeTarget)) {
    return;
  }

  const body = JSON.stringify({
    sessionId,
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
 *  - First-party Supabase Conversion Funnel via deduplicated non-blocking sendBeacon
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
