'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

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

export interface AnalyticsDashboardProps {
  dailySeries30: DailyMetricPoint[];
  funnels: {
    '7d': FunnelSnapshot;
    '14d': FunnelSnapshot;
    '30d': FunnelSnapshot;
  };
  topCities: CityRanking[];
  pixelStatus: PixelStatusSummary;
}

function formatCompactPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

function pct(part: number, whole: number): string {
  if (whole <= 0) return '0%';
  const val = (part / whole) * 100;
  return val >= 10 ? `${Math.round(val)}%` : `${val.toFixed(1)}%`;
}

export function AnalyticsDashboard({
  dailySeries30,
  funnels,
  topCities,
  pixelStatus,
}: AnalyticsDashboardProps) {
  const [range, setRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const daysCount = range === '7d' ? 7 : range === '14d' ? 14 : 30;
  const activeSeries = dailySeries30.slice(-daysCount);
  const activeFunnel = funnels[range];

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

  // Funnel stages (ordered high-to-low)
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
      stepRate: activeFunnel.visits > 0 ? pct(activeFunnel.productViews, activeFunnel.visits) : null,
    },
    {
      label: 'Added to cart',
      count: activeFunnel.addToCart,
      stepRate:
        activeFunnel.productViews > 0
          ? pct(activeFunnel.addToCart, activeFunnel.productViews)
          : null,
    },
    {
      label: 'Started checkout',
      count: activeFunnel.checkoutStart,
      stepRate:
        activeFunnel.addToCart > 0
          ? pct(activeFunnel.checkoutStart, activeFunnel.addToCart)
          : null,
    },
    {
      label: 'Orders placed',
      count: activeFunnel.purchases,
      stepRate:
        activeFunnel.checkoutStart > 0
          ? pct(activeFunnel.purchases, activeFunnel.checkoutStart)
          : null,
      accent: true,
    },
  ];

  const overallConversion =
    activeFunnel.visits > 0 ? pct(activeFunnel.purchases, activeFunnel.visits) : '0%';

  const maxCityRevenue = Math.max(...topCities.map((c) => c.revenue), 1);

  return (
    <section className="space-y-6">
      {/* Section Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                  pixelStatus.metaActive ? 'bg-emerald-600' : 'bg-neutral-300'
                }`}
              />
              <span>Meta</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  pixelStatus.tiktokActive ? 'bg-emerald-600' : 'bg-neutral-300'
                }`}
              />
              <span>TikTok</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  pixelStatus.ga4Active ? 'bg-emerald-600' : 'bg-neutral-300'
                }`}
              />
              <span>GA4</span>
            </span>
            <ArrowUpRight className="w-3 h-3 text-neutral-400" />
          </Link>
        </div>

        {/* Range Switcher (7D / 14D / 30D) */}
        <div className="inline-flex items-center bg-white border border-neutral-200 p-0.5 self-start sm:self-auto">
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
              {/* Horizontal muted gridlines */}
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

              {/* Daily Bars */}
              {activeSeries.map((point, i) => {
                const cx = padLeft + i * slotW + slotW / 2;
                const x = cx - barW / 2;
                const rawH = (point.revenue / maxDayRevenue) * plotH;
                const h = point.revenue > 0 ? Math.max(4, rawH) : 2;
                const y = padTop + plotH - h;
                const isHovered = hoveredIndex === i;

                // Show clean evenly spaced date labels without crowding
                const labelStep = daysCount === 30 ? 5 : daysCount === 14 ? 2 : 1;
                const showLabel = i % labelStep === 0 || i === activeSeries.length - 1;

                return (
                  <g
                    key={point.dateKey}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                  >
                    {/* Invisible wider hover hit column */}
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

            {topCities.length === 0 ? (
              <p className="py-10 text-center text-xs text-neutral-400">
                City rankings appear once orders are placed.
              </p>
            ) : (
              <div className="mt-4 space-y-3.5">
                {topCities.slice(0, 6).map((row) => {
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
                          className="h-full bg-neutral-900"
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
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-xs font-semibold text-neutral-900">
              Conversion funnel (unique sessions · last {daysCount} days)
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Tracks where shoppers engage and where they drop off before placing an order.
            </p>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-[11px] text-neutral-500">Store conversion rate</span>
            <span className="text-base font-semibold text-emerald-700 tabular-nums">
              {overallConversion}
            </span>
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
                      className={`h-full ${stage.accent ? 'bg-emerald-700' : 'bg-neutral-900'}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
