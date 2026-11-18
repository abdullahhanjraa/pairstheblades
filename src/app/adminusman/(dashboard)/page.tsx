import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatPKR } from '@/lib/formatters';
import { getAdminAnalyticsSnapshot } from '@/lib/admin-analytics';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';
import { ClearAllDataButton } from '@/components/admin/clear-all-data-button';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  ArrowRight,
  Package,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let orders: any[] = [];
  let products: any[] = [];
  let storeName = 'Pairs Knife & Sword Co.';
  let totalRevenue = 0;
  let totalOrders = 0;
  let unfulfilledOrdersCount = 0;

  try {
    const [dbOrders, dbProducts, store] = await Promise.all([
      prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        include: { variants: true },
      }),
      prisma.store.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { name: true },
      }),
    ]);

    orders = dbOrders;
    products = dbProducts;
    if (store?.name?.trim()) {
      storeName = store.name.trim();
    }
    totalOrders = orders.length;
    totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    unfulfilledOrdersCount = orders.filter((o) => o.fulfillmentStatus === 'UNFULFILLED').length;
  } catch (err) {
    console.error('Admin query error', err);
  }

  const analyticsSnapshot = await getAdminAnalyticsSnapshot(orders, products);
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-8 text-left">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-wider text-neutral-900 font-sans">
            Merchant Overview
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time sales, order triage, and inventory velocity for {storeName}.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <ClearAllDataButton />
          <Link
            href="/adminusman/orders"
            className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-sm"
          >
            Manage Orders ({unfulfilledOrdersCount} Pending)
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Total Revenue
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-full">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-neutral-900">
              {formatPKR(totalRevenue)}
            </span>
            <p className="text-[11px] text-neutral-400 mt-1">Across all orders</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Total Orders
            </span>
            <div className="p-2 bg-neutral-100 text-neutral-800 rounded-full">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-neutral-900">{totalOrders}</span>
            <p className="text-[11px] text-neutral-400 mt-1">Active catalog volume</p>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Average Order Value
            </span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-full">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-neutral-900">{formatPKR(aov)}</span>
            <p className="text-[11px] text-neutral-400 mt-1">Revenue per cart</p>
          </div>
        </div>

        {/* Unfulfilled Orders */}
        <div className="bg-white p-5 border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Awaiting Dispatch
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-full">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-700">
              {unfulfilledOrdersCount}
            </span>
            <p className="text-[11px] text-neutral-400 mt-1">Requires courier booking</p>
          </div>
        </div>
      </div>

      {/* Storefront Conversion Funnel, 14-Day Revenue Chart & Top Cities in Pakistan */}
      <AnalyticsDashboard initialSnapshot={analyticsSnapshot} />

      {/* Main Section: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 shadow-xs">
          <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                Recent Orders
              </h2>
              <p className="text-xs text-neutral-500">Latest nationwide orders</p>
            </div>
            <Link
              href="/adminusman/orders"
              className="text-xs font-semibold text-black hover:text-neutral-600 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="p-10 text-center text-xs text-neutral-400">
                No orders placed yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Order</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">City</th>
                    <th className="py-3 px-4 font-semibold">Payment</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-light">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-black">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-neutral-900">
                        {order.customerName}
                        <span className="block text-[10px] text-neutral-400">
                          {order.customerPhone}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600">{order.city}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-neutral-100 text-neutral-800">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            order.fulfillmentStatus === 'FULFILLED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-black text-right">
                        {formatPKR(order.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Products Overview & Low Stock Warnings */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                Active Catalog
              </h2>
              <Link
                href="/adminusman/products"
                className="text-xs text-black font-semibold hover:underline"
              >
                Edit Stock
              </Link>
            </div>

            <div className="space-y-3">
              {products.map((p) => {
                const totalStock = p.variants.reduce(
                  (sum: number, v: any) => sum + v.inventoryQuantity,
                  0
                );
                return (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2.5">
                      <Package className="w-4 h-4 text-neutral-400" />
                      <span className="font-semibold text-neutral-900 truncate max-w-[170px]">
                        {p.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded">
                      {totalStock} in stock
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Courier Dispatch Info */}
          <div className="bg-neutral-900 text-white p-5 border border-neutral-800 shadow-xs space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-neutral-200">
              Pakistani Courier Integration
            </h3>
            <p className="text-neutral-400 font-light leading-relaxed">
              When fulfilling customer orders in the Orders tab, enter tracking numbers from <strong>TCS, Trax, Call Courier, or Leopards</strong> to mark orders as Dispatched.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
