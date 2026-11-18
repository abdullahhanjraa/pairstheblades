import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { AdminSecurityGate } from '@/components/admin/admin-security-gate';
import { AUTH_COOKIE_NAME, verifySignedSessionToken } from '@/lib/session-edge';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordChanged?: string; expired?: string }>;
}) {
  const { passwordChanged, expired } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const [verified, store] = await Promise.all([
    verifySignedSessionToken(token),
    prisma.store
      .findFirst({
        orderBy: { createdAt: 'asc' },
        select: { name: true, adminSessionVersion: true },
      })
      .catch(() => null),
  ]);

  if (verified.valid) {
    const activeVersion = store?.adminSessionVersion ?? 1;

    if (verified.version === activeVersion) {
      redirect('/adminusman');
    }
  }

  return (
    <AdminSecurityGate
      storeName={store?.name || undefined}
      passwordChanged={passwordChanged === '1'}
      sessionExpired={expired === '1'}
    />
  );
}
