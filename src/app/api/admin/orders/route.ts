import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.fulfillmentStatus = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (err: any) {
    console.error('API Admin Orders GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Bulk Actions: Fulfill, Mark as Paid
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, orderIds, carrier } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one order to perform this action' },
        { status: 400 }
      );
    }

    if (action === 'bulk_fulfill') {
      const carrierName = carrier || 'TCS Express';
      const updatedCount = await prisma.$transaction(async (tx) => {
        let count = 0;
        for (const orderId of orderIds) {
          const randomTracking = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
          await tx.order.update({
            where: { id: orderId },
            data: {
              fulfillmentStatus: 'FULFILLED',
              trackingCompany: carrierName,
              trackingNumber: randomTracking,
            },
          });
          count++;
        }
        return count;
      });

      revalidatePath('/adminusman');
      revalidatePath('/adminusman/orders');

      return NextResponse.json({
        success: true,
        message: `Successfully marked ${updatedCount} orders as fulfilled with courier dispatch details.`,
        updatedCount,
      });
    }

    if (action === 'bulk_mark_paid') {
      const result = await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: { financialStatus: 'PAID' },
      });

      revalidatePath('/adminusman');
      revalidatePath('/adminusman/orders');

      return NextResponse.json({
        success: true,
        message: `Successfully marked ${result.count} orders as paid.`,
        updatedCount: result.count,
      });
    }

    return NextResponse.json({ error: `Unknown bulk action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('API Admin Orders PATCH error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update orders' }, { status: 500 });
  }
}

// Bulk Delete or Purge All Orders & Start Fresh
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { action, orderIds } = body;

    // Action 1: Purge All Orders & Start Fresh (Pre-Launch Reset)
    if (action === 'purge_all') {
      const [deletedItems, deletedOrders] = await prisma.$transaction([
        prisma.orderItem.deleteMany({}),
        prisma.order.deleteMany({}),
      ]);

      revalidatePath('/adminusman');
      revalidatePath('/adminusman/orders');

      return NextResponse.json({
        success: true,
        message: `All ${deletedOrders.count} orders and ${deletedItems.count} order items have been completely purged. Store database is fresh.`,
        deletedOrdersCount: deletedOrders.count,
      });
    }

    // Action 2: Delete Selected Orders
    if (action === 'delete_selected') {
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return NextResponse.json(
          { error: 'Please select at least one order to delete' },
          { status: 400 }
        );
      }

      const [deletedItems, deletedOrders] = await prisma.$transaction([
        prisma.orderItem.deleteMany({
          where: { orderId: { in: orderIds } },
        }),
        prisma.order.deleteMany({
          where: { id: { in: orderIds } },
        }),
      ]);

      revalidatePath('/adminusman');
      revalidatePath('/adminusman/orders');

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${deletedOrders.count} selected orders.`,
        deletedOrdersCount: deletedOrders.count,
      });
    }

    return NextResponse.json({ error: `Unknown delete action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('API Admin Orders DELETE error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete orders' }, { status: 500 });
  }
}
