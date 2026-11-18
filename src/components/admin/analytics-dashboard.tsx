'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, RefreshCw, RotateCcw, Check } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import type {
  AdminAnalyticsSnapshot,
  ProductRankingRow,
  ProductSignal,
} from '@/lib/admin-analytics';

export type {
  DailyMetricPoint,
  FunnelSnapshot,
  CityRanking,
  PixelStatusSummary,
  ProductRankingRow,
  ProductSignal,
  AdminAnalyticsSnapshot,
} from '@/lib/admin-analytics';

export interface AnalyticsDashboardProps {
  initialSnapshot: AdminAnalyticsSnapshot;
}

type ProductSortTab = 'views' | 'carts' | 'revenue' | 'conversion';

const SIGNAL_META: Record<
  ProductSignal,
  { label: string; guidance: string; className: string }
> = {
  winner: {
    label: 'Winner',
    guidance: 'Proven seller — safe to scale Instagram / TikTok ads.',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  high_interest: {
    label: 'High interest',
    guidance: 'Strong buyer demand — watch stock closely.',
    className: 'bg-neutral-900 text-white border-neutral-900',
  },
  active: {
    label: 'Getting views',
    guidance: 'Shoppers are browsing — monitor cart additions.',
    className: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  },
  needs_review: {
    label: 'Needs review',
    guidance: 'People click, then leave — check cover photo or price.',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  low_stock: {
    label: 'Low stock',
    guidance: 'Restock before spending more on ads for this blade.',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  quiet: {
    label: 'Quiet',
    guidance: 'No traffic reaching this blade yet.',
    className: 'bg-white text-neutral-400 border-neutral-200',
  },
};

function formatCompactPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

function formatRate(part: number, whole: number): string {
  if (whole <= 0) return '—';
  const clamped = Math.min(100, Math.max(0, (part / whole) * 100));
  if (clamped === 0) return '0%';
  if (clamped === 100) return '100%';
  return `${clamped.toFixed(1)}%`;
}

function formatPktTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Karachi',
    });
  } catch {
    return '';
  }
}

function formatPktTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Karachi',
    });
  } catch {
    return '';
  }
}

export function AnalyticsDashboard({ initialSnapshot }: AnalyticsDashboardProps) {
  const [snapshot, setSnapshot] = useState<AdminAnalyticsSnapshot>(initialSnapshot);
  const [range, setRange] = useState<'7d' | '14d' | '30d'>('14d');

  // Keep live snapshot synced whenever parent dashboard refreshes (e.g. after Clear All Data)
  useEffect(() => {
    setSnapshot(initialSnapshot);
  }, [initialSnapshot]);
  const [productSort, setProductSort] = useState<ProductSortTab>('views');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setStatusNotice(null);
    try {
      const res = await fetch('/api/admin/analytics', {
        method: 'GET',
        cache: 'no-store',
      });
      if (res.ok) {
        const fresh = (await res.json()) as AdminAnalyticsSnapshot;
        setSnapshot(fresh);
        setStatusNotice(`Updated ${formatPktTime(fresh.generatedAt)}`);
        setTimeout(() => setStatusNotice(null), 3500);
      }
    } catch (err) {
      console.error('Analytics refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConfirmResetFunnel = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/analytics', {
        method: 'DELETE',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.snapshot) {
          setSnapshot(data.snapshot);
        }
        setConfirmResetOpen(false);
        setStatusNotice('Funnel & product views reset to zero');
        setTimeout(() => setStatusNotice(null), 4000);
      }
    } catch (err) {
      console.error('Analytics reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const daysCount = range === '7d' ? 7 : range === '14d' ? 14 : 30;
  const activeSeries = snapshot.dailySeries30.slice(-daysCount);
  const activeFunnel = snapshot.funnels[range];
  const rawRankings: ProductRankingRow[] = snapshot.productRankings?.[range] || [];

  // Instant <1ms client-side sorting across all 4 perspectives
  const sortedProducts = useMemo(() => {
    const copy = [...rawRankings];
    if (productSort === 'views') {
      copy.sort((a, b) => b.views - a.views || b.addToCart - a.addToCart || b.revenue - a.revenue);
    } else if (productSort === 'carts') {
      copy.sort((a, b) => b.addToCart - a.addToCart || b.views - a.views || b.revenue - a.revenue);
    } else if (productSort === 'revenue') {
      copy.sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold || b.views - a.views);
    } else {
      copy.sort(
        (a, b) =>
          (b.viewToCartPct ?? -1) - (a.viewToCartPct ?? -1) ||
          b.addToCart - a.addToCart ||
          b.views - a.views
      );
    }
    return copy;
  }, [rawRankings, productSort]);

  // 3-Second Spotlight Leaders
  const totalProductViews = rawRankings.reduce((s, p) => s + p.views, 0);
  const topViewed = useMemo(() => {
    const best = [...rawRankings].sort((a, b) => b.views - a.views || b.addToCart - a.addToCart)[0];
    return best && best.views > 0 ? best : null;
  }, [rawRankings]);
  const topCarted = useMemo(() => {
    const best = [...rawRankings].sort((a, b) => b.addToCart - a.addToCart || b.views - a.views)[0];
    return best && best.addToCart > 0 ? best : null;
  }, [rawRankings]);
  const topEarner = useMemo(() => {
    const best = [...rawRankings].sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold)[0];
    return best && best.revenue > 0 ? best : null;
  }, [rawRankings]);

  const activeMetricMax = useMemo(() => {
    if (sortedProducts.length === 0) return 1;
    const vals = sortedProducts.map((p) =>
      productSort === 'views'
        ? p.views
        : productSort === 'carts'
        ? p.addToCart
        : productSort === 'revenue'
        ? p.revenue
        : p.viewToCartPct ?? 0
    );
    return Math.max(...vals, 1);
  }, [sortedProducts, productSort]);

  const periodRevenue = activeSeries.reduce((s, d) => s + d.revenue, 0);
  const periodOrders = activeSeries.reduce((s, d) => s + d.orders, 0);
  const maxDayRevenue = Math.max(...activeSeries.map((d) => d.revenue), 1000);

  // Chart dimensions
  const svgW = 720;
  const svgH = 210;
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 8;
  const padRight = 8;
  const plotW = svgW - padLeft - padRight;
  const plotH = svgH - padTop - padBottom;
  const slotW = plotW / Math.max(activeSeries.length, 1);
  const barW = Math.max(8, Math.min(32, slotW * 0.62));

  const hoveredPoint = hoveredIndex !== null ? activeSeries[hoveredIndex] : null;

  const funnelBase = Math.max(
    activeFunnel.visits,
    activeFunnel.productViews,
    activeFunnel.addToCart,
    activeFunnel.checkoutStart,
    activeFunnel.purchases,
    1
  );

  const funnelStages = [
    {
      label: 'Store visits',
      count: activeFunnel.visits,
      stepRate: null as string | null,
    },
    {
      label: 'Viewed blades',
      count: activeFunnel.productViews,
      stepRate: formatRate(activeFunnel.productViews, activeFunnel.visits),
    },
    {
      label: 'Added to cart',
      count: activeFunnel.addToCart,
      stepRate: formatRate(
        activeFunnel.addToCart,
        Math.max(activeFunnel.productViews, activeFunnel.addToCart > 0 ? activeFunnel.visits : 0)
      ),
    },
    {
      label: 'Started checkout',
      count: activeFunnel.checkoutStart,
      stepRate: formatRate(activeFunnel.checkoutStart, activeFunnel.addToCart),
    },
    {
      label: 'Orders placed',
      count: activeFunnel.purchases,
      stepRate: formatRate(activeFunnel.purchases, activeFunnel.checkoutStart),
      accent: true,
    },
  ];

  const overallConversion =
    activeFunnel.visits > 0 ? formatRate(activeFunnel.purchases, activeFunnel.visits) : '0%';

  const maxCityRevenue = Math.max(...snapshot.topCities.map((c) => c.revenue), 1);

  return (
    <section className="space-y-6">
      {/* Section Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-neutral-900">
            Storefront analytics &amp; conversion funnel
          </h2>

          {/* Connected Ad Pixels Quiet Status Strip */}
          <Link
            href="/adminusman/settings"
            className="inline-flex items-center space-x-3 px-2.5 py-1 bg-white border border-neutral-200 text-[11px] text-neutral-600 hover:border-neutral-400 transition-colors"
            title="Configure Meta, TikTok, and GA4 Pixels in Settings"
          >
            <span className="inline-flex items-center space-x-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  snapshot.pixelStatus.metaActive ? 'bg-emerald-600' : 'bg-neutral-300'
                }`}
              />
              <span>Meta</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  snapshot.pixelStatus.tiktokActive ? 'bg-emerald-600' : 'bg-neutral-300'
                }`}
              />
              <span>TikTok</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  snapshot.pixelStatus.ga4Active ? 'bg-emerald-600' : 'bg-neutral-300'
                }`}
              />
              <span>GA4</span>
            </span>
            <ArrowUpRight className="w-3 h-3 text-neutral-400" />
          </Link>

          {statusNotice && (
            <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-700 tabular-nums">
              <Check className="w-3 h-3" />
              <span>{statusNotice}</span>
            </span>
          )}
        </div>

        {/* Right Controls: Live Refresh + Range Switcher */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 disabled:opacity-60 transition-colors cursor-pointer"
            title="Fetch latest storefront visits, product views, funnel counts, and orders instantly"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing' : 'Refresh'}</span>
          </button>

          {/* Range Switcher (7D / 14D / 30D) */}
          <div className="inline-flex items-center bg-white border border-neutral-200 p-0.5">
            {(
              [
                { id: '7d', label: '7 days' },
                { id: '14d', label: '14 days' },
                { id: '30d', label: '30 days' },
              ] as const
            ).map((item) => {
              const active = range === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setRange(item.id);
                    setHoveredIndex(null);
                  }}
                  className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary Focal Visual: Revenue Trend Chart (Wide) + Top Cities Ledger (Narrow) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-neutral-100">
            <div>
              <span className="text-xs font-medium text-neutral-500">
                Revenue over last {daysCount} days
              </span>
              <div className="flex items-baseline space-x-3 mt-1">
                <span className="text-2xl font-semibold text-neutral-900 tabular-nums">
                  {formatCompactPKR(hoveredPoint ? hoveredPoint.revenue : periodRevenue)}
                </span>
                <span className="text-xs text-neutral-500 tabular-nums">
                  {hoveredPoint
                    ? `${hoveredPoint.label} · ${hoveredPoint.orders} ${
                        hoveredPoint.orders === 1 ? 'order' : 'orders'
                      }`
                    : `${periodOrders} ${periodOrders === 1 ? 'order' : 'orders'} total`}
                </span>
              </div>
            </div>

            <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
              Peak day: {formatCompactPKR(Math.max(...activeSeries.map((d) => d.revenue), 0))}
            </span>
          </div>

          {/* Native SVG Bar Chart — Quiet Grid, Single Graphite Ramp + Emerald Focus */}
          <div className="pt-4 w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-52 select-none"
              role="img"
              aria-label={`Daily revenue chart for the last ${daysCount} days`}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {[0, 0.33, 0.66, 1].map((ratio) => {
                const y = padTop + plotH * (1 - ratio);
                return (
                  <line
                    key={ratio}
                    x1={padLeft}
                    x2={svgW - padRight}
                    y1={y}
                    y2={y}
                    stroke="#e5e5e5"
                    strokeDasharray={ratio === 0 ? undefined : '3 3'}
                    strokeWidth={1}
                  />
                );
              })}

              {activeSeries.map((point, i) => {
                const cx = padLeft + i * slotW + slotW / 2;
                const x = cx - barW / 2;
                const rawH = (point.revenue / maxDayRevenue) * plotH;
                const h = point.revenue > 0 ? Math.max(4, rawH) : 2;
                const y = padTop + plotH - h;
                const isHovered = hoveredIndex === i;

                const labelStep = daysCount === 30 ? 5 : daysCount === 14 ? 2 : 1;
                const showLabel = i % labelStep === 0 || i === activeSeries.length - 1;

                return (
                  <g
                    key={point.dateKey}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                  >
                    <rect
                      x={padLeft + i * slotW}
                      y={padTop}
                      width={slotW}
                      height={plotH}
                      fill={isHovered ? 'rgba(23, 23, 23, 0.035)' : 'transparent'}
                    />
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={h}
                      rx={2}
                      fill={
                        isHovered
                          ? '#15803d'
                          : point.revenue > 0
                          ? '#171717'
                          : '#e5e5e5'
                      }
                    />
                    {showLabel && (
                      <text
                        x={cx}
                        y={svgH - 8}
                        textAnchor="middle"
                        fontSize="10"
                        fill={isHovered ? '#171717' : '#737373'}
                        className="font-mono"
                      >
                        {point.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Top Cities in Pakistan (1 col) */}
        <div className="bg-white border border-neutral-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-xs font-semibold text-neutral-900">
                Top cities in Pakistan
              </h3>
              <span className="text-[11px] text-neutral-400">By order revenue</span>
            </div>

            {snapshot.topCities.length === 0 ? (
              <p className="py-10 text-center text-xs text-neutral-400">
                City rankings appear once orders are placed.
              </p>
            ) : (
              <div className="mt-4 space-y-3.5">
                {snapshot.topCities.slice(0, 6).map((row) => {
                  const widthPct = Math.max(6, Math.round((row.revenue / maxCityRevenue) * 100));
                  return (
                    <div key={row.city} className="space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <div className="flex items-baseline space-x-2 min-w-0">
                          <span className="font-medium text-neutral-900 truncate">
                            {row.city}
                          </span>
                          <span className="text-[11px] text-neutral-400 tabular-nums">
                            {row.orders} {row.orders === 1 ? 'order' : 'orders'}
                          </span>
                        </div>
                        <span className="font-medium text-neutral-900 tabular-nums ml-2 flex-shrink-0">
                          {formatCompactPKR(row.revenue)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 transition-[width] duration-300 ease-out"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-[11px] text-neutral-400 pt-4 mt-4 border-t border-neutral-100">
            Use top-performing cities to focus Meta &amp; TikTok ad delivery.
          </p>
        </div>
      </div>

      {/* 5-Stage Conversion Funnel */}
      <div className="bg-white border border-neutral-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-xs font-semibold text-neutral-900">
                Conversion funnel (unique sessions · last {daysCount} days)
              </h3>
              {snapshot.funnelResetAt && (
                <span className="text-[11px] font-mono text-neutral-400">
                  Fresh since {formatPktTimestamp(snapshot.funnelResetAt)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Deduplicated 30-minute shopper sessions with automated bot filtering.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-baseline space-x-2">
              <span className="text-[11px] text-neutral-500">Store conversion rate</span>
              <span className="text-base font-semibold text-emerald-700 tabular-nums">
                {overallConversion}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 border border-neutral-200 text-[11px] font-medium text-neutral-600 hover:border-red-300 hover:text-red-700 hover:bg-red-50/50 transition-colors cursor-pointer"
              title="Reset conversion funnel & product view counters to zero (orders stay safe)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset funnel</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-5 gap-4">
          {funnelStages.map((stage) => {
            const barPct =
              stage.count > 0 ? Math.max(8, Math.round((stage.count / funnelBase) * 100)) : 0;
            return (
              <div
                key={stage.label}
                className="p-3.5 bg-neutral-50/70 border border-neutral-200/80 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-600">{stage.label}</span>
                  {stage.stepRate && (
                    <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                      {stage.stepRate}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <span
                    className={`text-2xl font-semibold tabular-nums block ${
                      stage.accent ? 'text-emerald-700' : 'text-neutral-900'
                    }`}
                  >
                    {stage.count.toLocaleString('en-PK')}
                  </span>
                  <div className="w-full h-1.5 bg-neutral-200/70 overflow-hidden">
                    <div
                      className={`h-full transition-[width] duration-300 ease-out ${
                        stage.accent ? 'bg-emerald-700' : 'bg-neutral-900'
                      }`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 10x Product Ranking & Blade Intelligence Module */}
      <div className="bg-white border border-neutral-200 p-5 space-y-5">
        {/* Header + 4 Instant Sort Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-xs font-semibold text-neutral-900">
              Product ranking &amp; blade intelligence (last {daysCount} days)
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Spot your most viewed blades, strongest add-to-cart interest, and top earners in 3 seconds.
            </p>
          </div>

          <div className="inline-flex items-center flex-wrap bg-neutral-50 border border-neutral-200 p-0.5 self-start lg:self-auto">
            {(
              [
                { id: 'views', label: 'Most viewed' },
                { id: 'carts', label: 'Most added to cart' },
                { id: 'revenue', label: 'Top selling' },
                { id: 'conversion', label: 'Best conversion' },
              ] as const
            ).map((tab) => {
              const active = productSort === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProductSort(tab.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Second Spotlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              heading: 'Most viewed blade',
              item: topViewed,
              metric: topViewed
                ? `${topViewed.views} ${topViewed.views === 1 ? 'view' : 'views'}`
                : null,
              sub:
                topViewed && totalProductViews > 0
                  ? `${formatRate(topViewed.views, totalProductViews)} of all blade views`
                  : 'Waiting for shopper views',
              accent: false,
            },
            {
              heading: 'Most added to cart',
              item: topCarted,
              metric: topCarted
                ? `${topCarted.addToCart} ${topCarted.addToCart === 1 ? 'cart' : 'carts'}`
                : null,
              sub: topCarted
                ? topCarted.viewToCartPct !== null
                  ? `${topCarted.viewToCartPct}% view to cart rate`
                  : 'Added directly via quick add'
                : 'Waiting for cart activity',
              accent: false,
            },
            {
              heading: 'Top revenue earner',
              item: topEarner,
              metric: topEarner ? formatCompactPKR(topEarner.revenue) : null,
              sub: topEarner
                ? `${topEarner.unitsSold} ${topEarner.unitsSold === 1 ? 'unit' : 'units'} sold`
                : 'No completed orders in window',
              accent: true,
            },
          ].map((card) => (
            <div
              key={card.heading}
              className="p-3.5 bg-neutral-50/70 border border-neutral-200/80 flex items-center space-x-3.5"
            >
              {card.item ? (
                <div className="relative w-14 h-11 bg-white border border-neutral-200 flex-shrink-0 overflow-hidden">
                  <Image
                    src={card.item.featuredImage}
                    alt={card.item.title}
                    fill
                    sizes="56px"
                    className="object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-14 h-11 bg-neutral-100 border border-neutral-200 flex-shrink-0 flex items-center justify-center text-[10px] font-mono text-neutral-400">
                  —
                </div>
              )}

              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-neutral-500 block">
                  {card.heading}
                </span>
                {card.item ? (
                  <>
                    <p className="text-xs font-semibold text-neutral-900 truncate mt-0.5">
                      {card.item.title}
                    </p>
                    <div className="flex items-baseline space-x-2 mt-0.5">
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          card.accent ? 'text-emerald-700' : 'text-neutral-900'
                        }`}
                      >
                        {card.metric}
                      </span>
                      <span className="text-[11px] text-neutral-400 truncate">{card.sub}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-neutral-400 mt-1">{card.sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Ranked Blade Leaderboard Table */}
        {sortedProducts.length === 0 ? (
          <p className="py-10 text-center text-xs text-neutral-400">
            No active products found in your catalog.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-[11px] text-neutral-500">
                  <th className="py-2.5 pr-3 font-medium w-10">Rank</th>
                  <th className="py-2.5 px-3 font-medium">Product</th>
                  <th className="py-2.5 px-3 font-medium">Signal &amp; Guidance</th>
                  <th className="py-2.5 px-3 font-medium text-right">Views</th>
                  <th className="py-2.5 px-3 font-medium text-right">Carts</th>
                  <th className="py-2.5 px-3 font-medium text-right">View → Cart</th>
                  <th className="py-2.5 px-3 font-medium text-right">Sold</th>
                  <th className="py-2.5 pl-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sortedProducts.map((item, idx) => {
                  const sig = SIGNAL_META[item.signal];
                  const activeVal =
                    productSort === 'views'
                      ? item.views
                      : productSort === 'carts'
                      ? item.addToCart
                      : productSort === 'revenue'
                      ? item.revenue
                      : item.viewToCartPct ?? 0;
                  const barPct =
                    activeVal > 0 ? Math.max(6, Math.round((activeVal / activeMetricMax) * 100)) : 0;

                  return (
                    <tr key={item.productId} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Rank */}
                      <td className="py-3 pr-3 font-mono text-xs font-semibold tabular-nums text-neutral-500">
                        <span
                          className={
                            idx === 0 && activeVal > 0 ? 'text-emerald-700' : 'text-neutral-400'
                          }
                        >
                          #{idx + 1}
                        </span>
                      </td>

                      {/* Product Thumbnail + Title + Share Bar */}
                      <td className="py-3 px-3 min-w-[220px]">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-11 h-9 bg-[#f6f6f6] border border-neutral-200 flex-shrink-0 overflow-hidden">
                            <Image
                              src={item.featuredImage}
                              alt={item.title}
                              fill
                              sizes="44px"
                              className="object-contain p-0.5"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <Link
                                href={`/products/${item.handle}`}
                                target="_blank"
                                className="font-medium text-neutral-900 hover:underline truncate max-w-[200px]"
                                title={item.title}
                              >
                                {item.title}
                              </Link>
                              <Link
                                href={`/products/${item.handle}`}
                                target="_blank"
                                className="text-neutral-400 hover:text-neutral-900 flex-shrink-0"
                                aria-label={`View ${item.title} live`}
                              >
                                <ArrowUpRight className="w-3 h-3" />
                              </Link>
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-neutral-400 tabular-nums">
                              <span>{formatCompactPKR(item.price)}</span>
                              <span>·</span>
                              <span
                                className={
                                  item.stock <= 5 ? 'text-red-600 font-medium' : 'text-neutral-400'
                                }
                              >
                                {item.stock} in stock
                              </span>
                            </div>
                            <div className="w-full max-w-[180px] h-1 bg-neutral-100 overflow-hidden">
                              <div
                                className={`h-full transition-[width] duration-300 ease-out ${
                                  idx === 0 && activeVal > 0 ? 'bg-emerald-700' : 'bg-neutral-800'
                                }`}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plain-English Smart Signal + Visible Actionable Guidance */}
                      <td className="py-3 px-3 min-w-[220px] max-w-[270px]">
                        <div className="flex flex-col items-start space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 text-[11px] font-medium border ${sig.className}`}
                          >
                            {sig.label}
                          </span>
                          <p className="text-[11px] leading-snug text-neutral-500">
                            {sig.guidance}
                          </p>
                        </div>
                      </td>

                      {/* Views */}
                      <td className="py-3 px-3 text-right font-medium text-neutral-900 tabular-nums">
                        {item.views.toLocaleString('en-PK')}
                      </td>

                      {/* Carts */}
                      <td className="py-3 px-3 text-right font-medium text-neutral-900 tabular-nums">
                        {item.addToCart.toLocaleString('en-PK')}
                      </td>

                      {/* View -> Cart % */}
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-neutral-600 tabular-nums">
                        {item.viewToCartPct !== null ? `${item.viewToCartPct}%` : '—'}
                      </td>

                      {/* Units Sold */}
                      <td className="py-3 px-3 text-right font-medium text-neutral-900 tabular-nums">
                        {item.unitsSold.toLocaleString('en-PK')}
                      </td>

                      {/* Revenue */}
                      <td className="py-3 pl-3 text-right font-semibold text-neutral-900 tabular-nums whitespace-nowrap">
                        {formatCompactPKR(item.revenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Safe Fresh-Start Funnel Reset */}
      <ConfirmDialog
        isOpen={confirmResetOpen}
        title="Reset Conversion Funnel"
        message="This resets all 5 funnel counters and product view/cart counters to zero so you can start tracking fresh. Your real customer Orders, Revenue, and Top Cities will NOT be deleted."
        confirmText="Reset to Zero"
        cancelText="Cancel"
        variant="danger"
        isLoading={isResetting}
        onConfirm={handleConfirmResetFunnel}
        onClose={() => setConfirmResetOpen(false)}
      />
    </section>
  );
}
