import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        title: true,
        handle: true,
        description: true,
        tags: true,
        price: true,
        compareAtPrice: true,
        featuredImage: true,
        variants: {
          select: {
            id: true,
            option1: true,
            price: true,
            inventoryQuantity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { products: dbProducts },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (err) {
    console.error('Catalog fetch error:', err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
