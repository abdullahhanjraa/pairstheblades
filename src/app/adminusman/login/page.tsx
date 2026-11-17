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
  const verified = await verifySignedSessionToken(token);

  if (verified.valid) {
    const store = await prisma.store
      .findFirst({ orderBy: { createdAt: 'asc' }, select: { adminSessionVersion: true } })
      .catch(() => null);
    const activeVersion = store?.adminSessionVersion ?? 1;

    if (verified.version === activeVersion) {
      redirect('/adminusman');
    }
  }

  return (
    <AdminSecurityGate
      passwordChanged={passwordChanged === '1'}
      sessionExpired={expired === '1'}
    />
  );
}
