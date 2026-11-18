import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { AUTH_COOKIE_NAME, verifySignedSessionToken } from '@/lib/session-edge';
import { getAdminAnalyticsSnapshot } from '@/lib/admin-analytics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function isAdminAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const verified = await verifySignedSessionToken(token);
  if (!verified.valid) return false;

  const store = await prisma.store
    .findFirst({ orderBy: { createdAt: 'asc' }, select: { adminSessionVersion: true } })
    .catch(() => null);
  return verified.version === (store?.adminSessionVersion ?? 1);
}

/**
 * GET /api/admin/analytics — Instant live analytics snapshot (no full page reload)
 */
export async function GET() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await getAdminAnalyticsSnapshot();
    return NextResponse.json(snapshot, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err: any) {
    console.error('Admin analytics GET error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load live analytics' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/analytics — Safe Fresh-Start Reset for Conversion Funnel.
 * Clears AnalyticsEvent rows and records Store.funnelResetAt so all 5 funnel stages
 * restart cleanly from 0 without deleting any real customer Orders or Revenue history.
 */
export async function DELETE() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const store = await prisma.store.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    await Promise.all([
      prisma.analyticsEvent.deleteMany({}),
      store
        ? prisma.store.update({
            where: { id: store.id },
            data: { funnelResetAt: now },
          })
        : Promise.resolve(null),
    ]);

    revalidatePath('/adminusman');

    const freshSnapshot = await getAdminAnalyticsSnapshot();
    return NextResponse.json(
      {
        success: true,
        snapshot: freshSnapshot,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    console.error('Admin analytics reset error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to reset conversion funnel' },
      { status: 500 }
    );
  }
}
