import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function cleanDigits(val: string): string {
  return val.replace(/\D/g, '');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderNumber, phone } = body;

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { error: 'Please enter both your Order Number and Contact Phone number.' },
        { status: 400 }
      );
    }

    const orderNum = parseInt(String(orderNumber).replace(/\D/g, ''), 10);
    if (isNaN(orderNum)) {
      return NextResponse.json(
        { error: 'Please enter a valid numeric Order Number (e.g. 1001).' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNum,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: `No order found with #${orderNum}. Please check your order confirmation.` },
        { status: 404 }
      );
    }

    // Verify phone digits match for security
    const orderPhoneDigits = cleanDigits(order.customerPhone);
    const queryPhoneDigits = cleanDigits(phone);

    const matches =
      orderPhoneDigits.endsWith(queryPhoneDigits) ||
      queryPhoneDigits.endsWith(orderPhoneDigits) ||
      orderPhoneDigits.slice(-7) === queryPhoneDigits.slice(-7);

    if (!matches) {
      return NextResponse.json(
        {
          error:
            'Phone number does not match the record for this order. Please enter the phone number provided at checkout.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerName: order.customerName,
        city: order.city,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        financialStatus: order.financialStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        trackingCompany: order.trackingCompany,
        trackingNumber: order.trackingNumber,
        totalPrice: order.totalPrice,
        items: order.items.map((i) => ({
          id: i.id,
          title: i.title,
          variantTitle: i.variantTitle,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
      },
    });
  } catch (err: any) {
    console.error('Track Order API Error:', err);
    return NextResponse.json({ error: err.message || 'Error tracking order' }, { status: 500 });
  }
}
