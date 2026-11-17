import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      fulfillmentStatus,
      trackingCompany,
      trackingNumber,
      financialStatus,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      city,
      province,
      postalCode,
      totalPrice,
      notes,
    } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If order is being cancelled and was not already cancelled, restock variants
    if (financialStatus === 'CANCELLED' && existingOrder.financialStatus !== 'CANCELLED') {
      for (const item of existingOrder.items) {
        if (item.variantId) {
          try {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: {
                inventoryQuantity: {
                  increment: item.quantity,
                },
              },
            });
          } catch (e) {
            console.warn(`Could not restock variant ${item.variantId}`);
          }
        }
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(fulfillmentStatus !== undefined && { fulfillmentStatus }),
        ...(trackingCompany !== undefined && { trackingCompany }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(financialStatus !== undefined && { financialStatus }),
        ...(customerName !== undefined && { customerName }),
        ...(customerPhone !== undefined && { customerPhone }),
        ...(customerEmail !== undefined && { customerEmail }),
        ...(shippingAddress !== undefined && { shippingAddress }),
        ...(city !== undefined && { city }),
        ...(province !== undefined && { province }),
        ...(postalCode !== undefined && { postalCode }),
        ...(totalPrice !== undefined && { totalPrice: Number(totalPrice) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        items: true,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/orders');

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error('Error updating order:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });

    revalidatePath('/admin');
    revalidatePath('/admin/orders');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
