import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { AdminHeader } from '@/components/admin/admin-header';
import { AUTH_COOKIE_NAME, verifySignedSessionToken } from '@/lib/session-edge';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const verified = await verifySignedSessionToken(token);

  if (!verified.valid) {
    redirect('/adminusman/login');
  }

  const [unfulfilledCount, store] = await Promise.all([
    prisma.order
      .count({
        where: { fulfillmentStatus: 'UNFULFILLED' },
      })
      .catch(() => 0),
    prisma.store.findFirst({ orderBy: { createdAt: 'asc' } }).catch(() => null),
  ]);

  const activeSessionVersion = store?.adminSessionVersion ?? 1;
  if (verified.version !== activeSessionVersion) {
    // Password was changed (session version rotated): clear stale cookie and lock immediately
    redirect('/api/admin/auth/clear');
  }

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
