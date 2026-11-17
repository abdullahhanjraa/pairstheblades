import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      handle,
      description,
      price,
      compareAtPrice,
      featuredImage,
      images,
      status,
      initialStock = 15,
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Product title is required and cannot be empty' },
        { status: 400 }
      );
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json(
        { error: 'Product price must be a valid positive number' },
        { status: 400 }
      );
    }

    const numCompareAtPrice =
      compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== ''
        ? Number(compareAtPrice)
        : null;

    if (numCompareAtPrice !== null && (isNaN(numCompareAtPrice) || numCompareAtPrice < numPrice)) {
      return NextResponse.json(
        { error: 'Compare at price cannot be lower than regular selling price' },
        { status: 400 }
      );
    }

    const cleanStock = Math.max(0, Math.floor(Number(initialStock) || 0));

    // Get default store
    let store = await prisma.store.findFirst();
    if (!store) {
      store = await prisma.store.create({
        data: { name: 'Pairs Knife & Sword Co.', handle: 'pairs-blades' },
      });
    }

    // Generate slug handle if not provided
    const productHandle =
      handle ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const defaultImage =
      featuredImage ||
      'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1200&auto=format&fit=crop';
    const imagesList = images && Array.isArray(images) && images.length > 0 ? images : [defaultImage];

    const variantsData =
      body.variants && Array.isArray(body.variants) && body.variants.length > 0
        ? body.variants.map((v: any) => ({
            title: v.title || v.option1 || 'Standard',
            option1: v.option1 || 'Standard',
            price: Number(v.price) || numPrice,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : numCompareAtPrice,
            inventoryQuantity: Math.max(0, Number(v.inventoryQuantity ?? cleanStock)),
            sku: v.sku || `${productHandle.toUpperCase().slice(0, 10)}-${(v.option1 || 'STD').toUpperCase()}`,
          }))
        : [
            {
              title: 'Standard',
              option1: 'Standard',
              price: numPrice,
              compareAtPrice: numCompareAtPrice,
              inventoryQuantity: cleanStock,
              sku: `${productHandle.toUpperCase().slice(0, 10)}-STD`,
            },
          ];

    // Create product with clean inventory record
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        title,
        handle: productHandle,
        description: description || 'Master-crafted high carbon blade.',
        price: numPrice,
        compareAtPrice: numCompareAtPrice,
        featuredImage: defaultImage,
        images: JSON.stringify(imagesList),
        status: status || 'ACTIVE',
        variants: {
          create: variantsData,
        },
      },
      include: { variants: true },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/collections/all');
    revalidatePath('/adminusman');
    revalidatePath('/adminusman/products');

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error('Error creating product:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
