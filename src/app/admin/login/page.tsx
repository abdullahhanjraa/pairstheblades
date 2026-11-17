import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminSecurityGate } from '@/components/admin/admin-security-gate';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('pairs_admin_auth')?.value;
  const isAuthorized = token === 'valid_founder_session_abdullah17';

  // If already authenticated, redirect straight to the dashboard
  if (isAuthorized) {
    redirect('/admin');
  }

  return <AdminSecurityGate />;
}
