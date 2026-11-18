import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { AUTH_COOKIE_NAME, verifySignedSessionToken } from '@/lib/session-edge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/admin/reset-test-data — Safe Client Handover Reset.
 * Clears test Orders, OrderItems, AnalyticsEvents, and coupon usageCount while
 * preserving 100% of Products, Photos, Inventory Stock, Settings, Pixels, and Admin Password.
 * Requires active signed admin session AND explicit { confirmation: "RESET" }.
 */
export async function POST(req: Request) {
  try {
    // 1. Verify cryptographic session & active DB session version
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const verified = await verifySignedSessionToken(token);

    if (!verified.valid) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication required.' },
        { status: 401 }
      );
    }

    const store = await prisma.store.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, adminSessionVersion: true },
    });

    if (verified.version !== (store?.adminSessionVersion ?? 1)) {
      return NextResponse.json(
        { error: 'Unauthorized: Session expired. Please sign in again.' },
        { status: 401 }
      );
    }

    // 2. Enforce explicit confirmation keyword to prevent accidental triggers
    const body = await req.json().catch(() => ({}));
    if (body?.confirmation !== 'RESET') {
      return NextResponse.json(
        { error: 'Confirmation required: please type RESET to clear all data.' },
        { status: 400 }
      );
    }

    // 3. Atomic transaction: clear test orders, funnel events, coupon usage; preserve catalog & config
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({});
      const deletedOrders = await tx.order.deleteMany({});
      const deletedEvents = await tx.analyticsEvent.deleteMany({});
      await tx.discount.updateMany({ data: { usageCount: 0 } });

      if (store?.id) {
        await tx.store.update({
          where: { id: store.id },
          data: { funnelResetAt: now },
        });
      }

      return {
        orders: deletedOrders.count,
        analyticsEvents: deletedEvents.count,
      };
    });

    // 4. Revalidate all admin views so KPIs, header badge, funnel, cities & orders snap to zero
    revalidatePath('/adminusman', 'layout');
    revalidatePath('/adminusman');
    revalidatePath('/adminusman/orders');
    revalidatePath('/adminusman/products');
    revalidatePath('/adminusman/settings');

    return NextResponse.json({
      success: true,
      cleared: result,
      message: 'All orders, revenue, and analytics data cleared. Store is ready for a fresh start.',
    });
  } catch (err: any) {
    console.error('Reset data error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to clear store data.' },
      { status: 500 }
    );
  }
}
