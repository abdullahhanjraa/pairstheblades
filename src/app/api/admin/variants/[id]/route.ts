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
    const { inventoryQuantity, price } = body;

    const updated = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(inventoryQuantity !== undefined && { inventoryQuantity: Number(inventoryQuantity) }),
        ...(price !== undefined && { price: Number(price) }),
      },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/collections/all');
    revalidatePath('/admin');
    revalidatePath('/admin/products');

    return NextResponse.json({ success: true, variant: updated });
  } catch (err: any) {
    console.error('Error updating variant:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update variant' },
      { status: 500 }
    );
  }
}
