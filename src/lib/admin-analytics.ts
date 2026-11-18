import { prisma } from '@/lib/db';
import {
  sanitizeMetaPixelId,
  sanitizeTikTokPixelId,
  sanitizeGa4Id,
} from '@/lib/analytics';

export interface DailyMetricPoint {
  dateKey: string; // YYYY-MM-DD
  label: string;   // e.g. "Nov 18"
  revenue: number;
  orders: number;
}

export interface FunnelSnapshot {
  visits: number;
  productViews: number;
  addToCart: number;
  checkoutStart: number;
  purchases: number;
}

export interface CityRanking {
  city: string;
  orders: number;
  revenue: number;
}

export interface PixelStatusSummary {
  metaActive: boolean;
  tiktokActive: boolean;
  ga4Active: boolean;
}

export interface AdminAnalyticsSnapshot {
  dailySeries30: DailyMetricPoint[];
  funnels: {
    '7d': FunnelSnapshot;
    '14d': FunnelSnapshot;
    '30d': FunnelSnapshot;
  };
  topCities: CityRanking[];
  pixelStatus: PixelStatusSummary;
  funnelResetAt: string | null;
  generatedAt: string;
}

function toPktDateKey(date: Date): string {
  const pkt = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  return pkt.toISOString().slice(0, 10);
}

function formatDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function normalizeCityName(raw?: string | null): string {
  const clean = (raw || '').trim();
  if (!clean) return 'Other';
  return clean
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function getAdminAnalyticsSnapshot(
  preloadedOrders?: Array<{ totalPrice: number; city: string | null; createdAt: Date }>
): Promise<AdminAnalyticsSnapshot> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [orders, analyticsEvents, storeMeta] = await Promise.all([
    preloadedOrders
      ? Promise.resolve(preloadedOrders)
      : prisma.order
          .findMany({
            select: { totalPrice: true, city: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          })
          .catch(() => []),
    prisma.analyticsEvent
      .findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { sessionId: true, eventType: true, createdAt: true },
      })
      .catch(() => []),
    prisma.store
      .findFirst({
        orderBy: { createdAt: 'asc' },
        select: {
          metaPixelId: true,
          tiktokPixelId: true,
          ga4MeasurementId: true,
          funnelResetAt: true,
        },
      })
      .catch(() => null),
  ]);

  // 1. 30-day PKT daily revenue & order series
  const dailyMap = new Map<string, DailyMetricPoint>();
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = toPktDateKey(d);
    if (!dailyMap.has(key)) {
      dailyMap.set(key, {
        dateKey: key,
        label: formatDayLabel(key),
        revenue: 0,
        orders: 0,
      });
    }
  }
  for (const order of orders) {
    const key = toPktDateKey(new Date(order.createdAt));
    const bucket = dailyMap.get(key);
    if (bucket) {
      bucket.revenue += order.totalPrice;
      bucket.orders += 1;
    }
  }
  const dailySeries30 = Array.from(dailyMap.values());

  // 2. Honest unique-session Conversion Funnels (respecting Store.funnelResetAt)
  const resetMs = storeMeta?.funnelResetAt ? new Date(storeMeta.funnelResetAt).getTime() : 0;

  const buildFunnel = (days: number): FunnelSnapshot => {
    const rangeCutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const effectiveCutoff = Math.max(rangeCutoff, resetMs);

    const sets = {
      PAGE_VIEW: new Set<string>(),
      PRODUCT_VIEW: new Set<string>(),
      ADD_TO_CART: new Set<string>(),
      CHECKOUT_START: new Set<string>(),
      PURCHASE: new Set<string>(),
    };

    for (const ev of analyticsEvents) {
      if (new Date(ev.createdAt).getTime() < effectiveCutoff) continue;
      const key = ev.eventType as keyof typeof sets;
      if (sets[key]) {
        sets[key].add(ev.sessionId);
        // Any downstream shopper interaction mathematically implies a store visit
        sets.PAGE_VIEW.add(ev.sessionId);
      }
    }

    const ordersSinceCutoff = orders.filter(
      (o) => new Date(o.createdAt).getTime() >= effectiveCutoff
    ).length;

    const purchases = Math.max(sets.PURCHASE.size, ordersSinceCutoff);
    const visits = Math.max(sets.PAGE_VIEW.size, purchases);

    return {
      visits,
      productViews: sets.PRODUCT_VIEW.size,
      addToCart: sets.ADD_TO_CART.size,
      checkoutStart: sets.CHECKOUT_START.size,
      purchases,
    };
  };

  const funnels = {
    '7d': buildFunnel(7),
    '14d': buildFunnel(14),
    '30d': buildFunnel(30),
  };

  // 3. Top Cities in Pakistan ranked by total order revenue
  const cityMap = new Map<string, CityRanking>();
  for (const order of orders) {
    const cityName = normalizeCityName(order.city);
    const existing = cityMap.get(cityName);
    if (existing) {
      existing.orders += 1;
      existing.revenue += order.totalPrice;
    } else {
      cityMap.set(cityName, {
        city: cityName,
        orders: 1,
        revenue: order.totalPrice,
      });
    }
  }
  const topCities = Array.from(cityMap.values()).sort(
    (a, b) => b.revenue - a.revenue || b.orders - a.orders
  );

  const pixelStatus: PixelStatusSummary = {
    metaActive: Boolean(sanitizeMetaPixelId(storeMeta?.metaPixelId)),
    tiktokActive: Boolean(sanitizeTikTokPixelId(storeMeta?.tiktokPixelId)),
    ga4Active: Boolean(sanitizeGa4Id(storeMeta?.ga4MeasurementId)),
  };

  return {
    dailySeries30,
    funnels,
    topCities,
    pixelStatus,
    funnelResetAt: storeMeta?.funnelResetAt ? new Date(storeMeta.funnelResetAt).toISOString() : null,
    generatedAt: new Date().toISOString(),
  };
}
