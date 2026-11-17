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
      title,
      description,
      price,
      compareAtPrice,
      featuredImage,
      images,
      status,
      stock,
      inventoryQuantity,
    } = body;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (featuredImage !== undefined) dataToUpdate.featuredImage = featuredImage;
    if (images !== undefined) dataToUpdate.images = JSON.stringify(images);
    if (status !== undefined) dataToUpdate.status = status;
    if (price !== undefined) dataToUpdate.price = Number(price);
    if (compareAtPrice !== undefined) {
      dataToUpdate.compareAtPrice = compareAtPrice ? Number(compareAtPrice) : null;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
      include: { variants: true },
    });

    // If price changed, update variant prices as well
    if (price !== undefined) {
      await prisma.productVariant.updateMany({
        where: { productId: id },
        data: {
          price: Number(price),
          compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        },
      });
    }

    // Update variant stock if provided
    const stockQty =
      stock !== undefined
        ? Number(stock)
        : inventoryQuantity !== undefined
        ? Number(inventoryQuantity)
        : undefined;

    if (stockQty !== undefined && !isNaN(stockQty)) {
      if (updated.variants.length > 0) {
        await prisma.productVariant.update({
          where: { id: updated.variants[0].id },
          data: { inventoryQuantity: Math.max(0, stockQty) },
        });
      } else {
        await prisma.productVariant.create({
          data: {
            productId: id,
            title: 'Standard',
            option1: 'Standard',
            price: Number(price !== undefined ? price : updated.price),
            compareAtPrice: compareAtPrice ? Number(compareAtPrice) : updated.compareAtPrice,
            inventoryQuantity: Math.max(0, stockQty),
          },
        });
      }
    }

    const finalProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/collections/all');
    revalidatePath(`/products/${updated.handle}`);
    revalidatePath('/adminusman');
    revalidatePath('/adminusman/products');

    return NextResponse.json({ success: true, product: finalProduct || updated });
  } catch (err: any) {
    console.error('Error updating product:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Unlink historical order items so orders retain receipts without foreign key locks
    await prisma.orderItem.updateMany({
      where: { productId: id },
      data: { productId: null, variantId: null },
    });

    // 2. Delete variants
    await prisma.productVariant.deleteMany({
      where: { productId: id },
    });

    // 3. Delete product
    const deleted = await prisma.product.delete({
      where: { id },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/collections/all');
    revalidatePath('/adminusman');
    revalidatePath('/adminusman/products');

    return NextResponse.json({ success: true, deletedId: deleted.id });
  } catch (err: any) {
    console.error('Error deleting product:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
