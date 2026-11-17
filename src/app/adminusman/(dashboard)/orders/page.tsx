import React from 'react';
import { prisma } from '@/lib/db';
import { OrdersTable } from './orders-table';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  let orders: any[] = [];
  let store: any = null;

  try {
    store = await prisma.store.findFirst();
    orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Error fetching admin orders:', err);
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-black font-sans">
          Orders & Dispatch Desk
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Review nationwide COD orders, book courier shipments, and track fulfillment status.
        </p>
      </div>

      <OrdersTable initialOrders={orders} store={store} />
    </div>
  );
}
