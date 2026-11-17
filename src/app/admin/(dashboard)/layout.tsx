import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { AdminHeader } from '@/components/admin/admin-header';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('pairs_admin_auth')?.value;
  const isAuthorized = token === 'valid_founder_session_abdullah17';

  // If unauthorized, redirect to the isolated Admin Login Gatekeeper
  if (!isAuthorized) {
    redirect('/admin/login');
  }

  const [unfulfilledCount, store] = await Promise.all([
    prisma.order
      .count({
        where: { fulfillmentStatus: 'UNFULFILLED' },
      })
      .catch(() => 0),
    prisma.store.findFirst().catch(() => null),
  ]);

  return (
    <div className="min-h-screen bg-neutral-100/60 flex flex-col font-sans">
      {/* Dynamic Responsive Admin Header */}
      <AdminHeader storeName={store?.name} unfulfilledCount={unfulfilledCount} />

      {/* Main Admin Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
