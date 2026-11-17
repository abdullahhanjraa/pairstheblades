import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, value, minSubtotal, type } = body;

    const discount = await prisma.discount.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(value !== undefined && { value: Number(value) }),
        ...(minSubtotal !== undefined && { minSubtotal: Number(minSubtotal) }),
        ...(type !== undefined && { type }),
      },
    });

    return NextResponse.json({ success: true, discount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.discount.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
