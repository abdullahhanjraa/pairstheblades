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

export type ProductSignal =
  | 'winner'
  | 'high_interest'
  | 'active'
  | 'needs_review'
  | 'low_stock'
  | 'quiet';

export interface ProductRankingRow {
  productId: string;
  title: string;
  handle: string;
  featuredImage: string;
  price: number;
  stock: number;
  views: number;
  addToCart: number;
  viewToCartPct: number | null;
  unitsSold: number;
  revenue: number;
  signal: ProductSignal;
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
  productRankings: {
    '7d': ProductRankingRow[];
    '14d': ProductRankingRow[];
    '30d': ProductRankingRow[];
  };
  topCities: CityRanking[];
  pixelStatus: PixelStatusSummary;
  funnelResetAt: string | null;
  generatedAt: string;
}

interface PreloadedOrder {
  totalPrice: number;
  city: string | null;
  createdAt: Date;
  items?: Array<{
    productId: string | null;
    quantity: number;
    price: number;
  }>;
}

interface PreloadedProduct {
  id: string;
  title: string;
  handle: string;
  featuredImage: string;
  price: number;
  status?: string;
  variants?: Array<{ inventoryQuantity: number }>;
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

function classifyProductSignal(params: {
  views: number;
  addToCart: number;
  viewToCartPct: number | null;
  unitsSold: number;
  stock: number;
}): ProductSignal {
  const { views, addToCart, viewToCartPct, unitsSold, stock } = params;
  const hasDemand = views > 0 || addToCart > 0 || unitsSold > 0;

  if (hasDemand && stock <= 5) return 'low_stock';
  if (unitsSold >= 1) return 'winner';
  if (addToCart >= 1 && (viewToCartPct === null || viewToCartPct >= 15)) return 'high_interest';
  if (views >= 10 && (viewToCartPct ?? 0) < 5) return 'needs_review';
  if (views > 0 || addToCart > 0) return 'active';
  return 'quiet';
}

export async function getAdminAnalyticsSnapshot(
  preloadedOrders?: PreloadedOrder[],
  preloadedProducts?: PreloadedProduct[]
): Promise<AdminAnalyticsSnapshot> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [orders, products, analyticsEvents, storeMeta] = await Promise.all([
    preloadedOrders
      ? Promise.resolve(preloadedOrders)
      : prisma.order
          .findMany({
            select: {
              totalPrice: true,
              city: true,
              createdAt: true,
              items: {
                select: {
                  productId: true,
                  quantity: true,
                  price: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
          .catch(() => []),
    preloadedProducts
      ? Promise.resolve(preloadedProducts)
      : prisma.product
          .findMany({
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              title: true,
              handle: true,
              featuredImage: true,
              price: true,
              status: true,
              variants: { select: { inventoryQuantity: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
          .catch(() => []),
    prisma.analyticsEvent
      .findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { sessionId: true, eventType: true, productId: true, createdAt: true },
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

  const activeProducts = products.filter((p) => !p.status || p.status === 'ACTIVE');

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

  // 2. Honest unique-session Conversion Funnels & Product Rankings (respecting funnelResetAt)
  const resetMs = storeMeta?.funnelResetAt ? new Date(storeMeta.funnelResetAt).getTime() : 0;

  const buildWindowMetrics = (days: number): {
    funnel: FunnelSnapshot;
    rankings: ProductRankingRow[];
  } => {
    const rangeCutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const effectiveFunnelCutoff = Math.max(rangeCutoff, resetMs);

    const sets = {
      PAGE_VIEW: new Set<string>(),
      PRODUCT_VIEW: new Set<string>(),
      ADD_TO_CART: new Set<string>(),
      CHECKOUT_START: new Set<string>(),
      PURCHASE: new Set<string>(),
    };

    const viewsByProduct = new Map<string, Set<string>>();
    const cartsByProduct = new Map<string, Set<string>>();

    for (const ev of analyticsEvents) {
      const ts = new Date(ev.createdAt).getTime();
      if (ts < effectiveFunnelCutoff) continue;

      const key = ev.eventType as keyof typeof sets;
      if (sets[key]) {
        sets[key].add(ev.sessionId);
        sets.PAGE_VIEW.add(ev.sessionId);
      }

      if (ev.productId) {
        if (ev.eventType === 'PRODUCT_VIEW') {
          let s = viewsByProduct.get(ev.productId);
          if (!s) {
            s = new Set<string>();
            viewsByProduct.set(ev.productId, s);
          }
          s.add(ev.sessionId);
        } else if (ev.eventType === 'ADD_TO_CART') {
          let s = cartsByProduct.get(ev.productId);
          if (!s) {
            s = new Set<string>();
            cartsByProduct.set(ev.productId, s);
          }
          s.add(ev.sessionId);
        }
      }
    }

    const salesByProduct = new Map<string, { units: number; revenue: number }>();
    let ordersSinceFunnelCutoff = 0;

    for (const order of orders) {
      const orderTs = new Date(order.createdAt).getTime();
      if (orderTs >= effectiveFunnelCutoff) {
        ordersSinceFunnelCutoff += 1;
      }
      if (orderTs >= rangeCutoff && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (!item.productId) continue;
          const prev = salesByProduct.get(item.productId) || { units: 0, revenue: 0 };
          prev.units += item.quantity || 0;
          prev.revenue += (item.price || 0) * (item.quantity || 0);
          salesByProduct.set(item.productId, prev);
        }
      }
    }

    const purchases = Math.max(sets.PURCHASE.size, ordersSinceFunnelCutoff);
    const visits = Math.max(sets.PAGE_VIEW.size, purchases);

    const rankings: ProductRankingRow[] = activeProducts
      .map((p) => {
        const views = viewsByProduct.get(p.id)?.size ?? 0;
        const addToCart = cartsByProduct.get(p.id)?.size ?? 0;
        const sales = salesByProduct.get(p.id) || { units: 0, revenue: 0 };
        const stock = (p.variants || []).reduce(
          (sum, v) => sum + (v.inventoryQuantity ?? 0),
          0
        );
        const viewToCartPct =
          views > 0 ? Math.min(100, Number(((addToCart / views) * 100).toFixed(1))) : null;

        return {
          productId: p.id,
          title: p.title,
          handle: p.handle,
          featuredImage: p.featuredImage,
          price: p.price,
          stock,
          views,
          addToCart,
          viewToCartPct,
          unitsSold: sales.units,
          revenue: sales.revenue,
          signal: classifyProductSignal({
            views,
            addToCart,
            viewToCartPct,
            unitsSold: sales.units,
            stock,
          }),
        };
      })
      .sort(
        (a, b) =>
          b.views - a.views ||
          b.addToCart - a.addToCart ||
          b.revenue - a.revenue ||
          a.title.localeCompare(b.title)
      );

    return {
      funnel: {
        visits,
        productViews: sets.PRODUCT_VIEW.size,
        addToCart: sets.ADD_TO_CART.size,
        checkoutStart: sets.CHECKOUT_START.size,
        purchases,
      },
      rankings,
    };
  };

  const w7 = buildWindowMetrics(7);
  const w14 = buildWindowMetrics(14);
  const w30 = buildWindowMetrics(30);

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
    funnels: {
      '7d': w7.funnel,
      '14d': w14.funnel,
      '30d': w30.funnel,
    },
    productRankings: {
      '7d': w7.rankings,
      '14d': w14.rankings,
      '30d': w30.rankings,
    },
    topCities,
    pixelStatus,
    funnelResetAt: storeMeta?.funnelResetAt ? new Date(storeMeta.funnelResetAt).toISOString() : null,
    generatedAt: new Date().toISOString(),
  };
}
