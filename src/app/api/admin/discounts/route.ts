import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ discounts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, type, value, minSubtotal, status } = body;

    if (!code || !value) {
      return NextResponse.json(
        { error: 'Code and discount value are required' },
        { status: 400 }
      );
    }

    const store = await prisma.store.findFirst();
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const formattedCode = code.trim().toUpperCase();

    // Validate percentage ceiling
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      return NextResponse.json(
        { error: 'Discount value must be a positive number' },
        { status: 400 }
      );
    }
    if ((type === 'PERCENTAGE' || !type) && numericValue > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    const existing = await prisma.discount.findUnique({
      where: { code: formattedCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Promotional code '${formattedCode}' already exists. Please choose a different code.` },
        { status: 400 }
      );
    }

    const discount = await prisma.discount.create({
      data: {
        storeId: store.id,
        code: formattedCode,
        type: type || 'PERCENTAGE',
        value: numericValue,
        minSubtotal: Math.max(0, Number(minSubtotal) || 0),
        status: status || 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, discount });
  } catch (err: any) {
    if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
      return NextResponse.json(
        { error: `Promotional code already exists in your store. Please choose a different code.` },
        { status: 400 }
      );
    }
    console.error('Error creating discount:', err);
    return NextResponse.json(
      { error: 'Failed to create discount. Please check input and try again.' },
      { status: 500 }
    );
  }
}
