import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subtotal } = body;

    if (!code) {
      return NextResponse.json({ valid: false, message: 'Please enter a promotional code' });
    }

    const formattedCode = code.trim().toUpperCase();

    const discount = await prisma.discount.findUnique({
      where: { code: formattedCode },
    });

    if (!discount || discount.status !== 'ACTIVE') {
      return NextResponse.json({ valid: false, message: 'Invalid or expired promotional code' });
    }

    const orderSubtotal = Number(subtotal) || 0;

    if (discount.minSubtotal > 0 && orderSubtotal < discount.minSubtotal) {
      return NextResponse.json({
        valid: false,
        message: `This coupon requires a minimum subtotal of Rs. ${discount.minSubtotal.toLocaleString()}`,
      });
    }

    let discountAmount = 0;
    if (discount.type === 'PERCENTAGE') {
      discountAmount = Math.round((orderSubtotal * discount.value) / 100);
    } else {
      discountAmount = Math.min(orderSubtotal, discount.value);
    }

    return NextResponse.json({
      valid: true,
      code: discount.code,
      discountAmount,
      message: `Promo code ${discount.code} applied: ${
        discount.type === 'PERCENTAGE' ? `${discount.value}% OFF` : `Rs. ${discount.value} OFF`
      } (-Rs. ${discountAmount.toLocaleString()})`,
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, message: 'Error validating discount code' }, { status: 500 });
  }
}
