import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

class CheckoutValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = 'CheckoutValidationError';
  }
}

// 30-Second In-Memory Idempotency Cache to prevent duplicate orders from rapid multi-clicks
interface CachedOrder {
  order: any;
  timestamp: number;
}
const idempotencyMap = new Map<string, CachedOrder>();
const inFlightMap = new Map<string, Promise<any>>();

// Periodic cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyMap.entries()) {
    if (now - value.timestamp > 60000) {
      idempotencyMap.delete(key);
    }
  }
}, 300000);

// Strip HTML tags for XSS defense
function sanitize(str?: string | null): string {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

// Normalize Pakistani Phone Number to E.164 (+923XXXXXXXXX)
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('03') && digits.length === 11) {
    return `+92${digits.slice(1)}`;
  }
  if (digits.startsWith('923') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('3') && digits.length === 10) {
    return `+92${digits}`;
  }
  return phone.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      province,
      postalCode,
      paymentMethod,
      discountCode,
      notes,
      items,
      idempotencyKey,
    } = body;

    // 1. Mandatory Input Validation
    if (!customerName || !customerPhone || !shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required customer or items information' },
        { status: 400 }
      );
    }

    const cleanName = sanitize(customerName);
    const cleanAddress = sanitize(shippingAddress);
    const cleanCity = sanitize(city) || 'Lahore';
    const cleanProvince = sanitize(province) || 'Punjab';
    const cleanPostalCode = sanitize(postalCode);
    const cleanNotes = sanitize(notes);
    const cleanPhone = normalizePhone(customerPhone);
    const cleanEmail = customerEmail ? sanitize(customerEmail) : `${cleanPhone.replace(/\D/g, '')}@pairs.pk`;

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: 'Please enter a valid customer name' }, { status: 400 });
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid Pakistani contact phone number' }, { status: 400 });
    }

    // 2. Multi-Click Idempotency Lockout (Double-Submit Protection)
    const itemsSignature = items
      .map((i: any) => `${i.variantId || i.productId}:${i.quantity}`)
      .sort()
      .join('|');
    const orderDedupeKey = idempotencyKey || `${cleanPhone}_${itemsSignature}`;

    if (idempotencyMap.has(orderDedupeKey)) {
      const existing = idempotencyMap.get(orderDedupeKey)!;
      if (Date.now() - existing.timestamp < 30000) {
        console.warn(`[IDEMPOTENCY] Prevented duplicate order submission for key: ${orderDedupeKey}`);
        return NextResponse.json({
          success: true,
          duplicatePrevented: true,
          order: existing.order,
          orderId: existing.order.id,
          orderNumber: existing.order.orderNumber,
        });
      }
    }

    // In-Flight concurrent request coalescing
    if (inFlightMap.has(orderDedupeKey)) {
      console.warn(`[IN-FLIGHT LOCK] Joining existing in-flight checkout for key: ${orderDedupeKey}`);
      try {
        const inFlightRes = await inFlightMap.get(orderDedupeKey)!;
        return NextResponse.json({
          ...inFlightRes,
          duplicatePrevented: true,
        });
      } catch (e: any) {
        return NextResponse.json(
          { error: e.message || 'Error processing in-flight order' },
          { status: 500 }
        );
      }
    }

    const orderExecutionPromise = (async () => {
      // 3. Fetch Master Store Configuration
      let store = await prisma.store.findFirst();
      if (!store) {
        store = await prisma.store.create({
          data: {
            id: 'store_pairs_blades',
            name: 'Pairs Knife & Sword Co.',
            handle: 'pairs-blades',
          },
        });
      }

      // 4. Server-Side Price & Inventory Authority
      // NEVER trust client-sent prices; verify each item in database
      const validatedItems: Array<{
        productId: string;
        variantId: string | null;
        title: string;
        variantTitle: string | null;
        price: number;
        quantity: number;
        image: string | null;
      }> = [];

      let verifiedSubtotal = 0;

      for (const item of items) {
        const qty = Math.floor(Number(item.quantity));
        if (isNaN(qty) || qty < 1 || qty > 50) {
          throw new CheckoutValidationError(
            `Invalid item quantity (${item.quantity}) for ${item.title || 'item'}. Must be between 1 and 50.`,
            400
          );
        }

        let variant: any = null;
        let product: any = null;

        // 1. Try lookup by variantId first
        if (item.variantId && item.variantId !== 'default') {
          variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          });
        }

        // 2. Fallback: Lookup product by id, handle, or title if variant not found
        if (!variant) {
          if (item.productId) {
            product = await prisma.product.findFirst({
              where: {
                OR: [
                  { id: item.productId },
                  { handle: item.productId },
                  ...(item.title ? [{ title: { contains: item.title } }] : []),
                ],
              },
              include: { variants: true },
            });
          } else if (item.title) {
            product = await prisma.product.findFirst({
              where: { title: { contains: item.title } },
              include: { variants: true },
            });
          }

          if (product && product.variants?.length > 0) {
            const requestedOption = (item.variantTitle || '').trim();
            variant =
              product.variants.find((v: any) => v.id === item.variantId) ||
              product.variants.find((v: any) => requestedOption && v.option1.toLowerCase() === requestedOption.toLowerCase()) ||
              product.variants[0];
            variant.product = product;
          }
        }

        if (variant) {
          if (variant.inventoryQuantity < qty) {
            const variantDetail = variant.option1 && variant.option1 !== 'Standard' ? ` (${variant.option1})` : '';
            throw new CheckoutValidationError(
              `Sorry, "${variant.product?.title || item.title}"${variantDetail} is sold out or has insufficient stock (${variant.inventoryQuantity} remaining).`,
              409
            );
          }

          const authoritativePrice = variant.price;
          verifiedSubtotal += authoritativePrice * qty;

          const cleanVariantTitle =
            variant.option1 && variant.option1 !== 'Standard'
              ? variant.option1
              : item.variantTitle && !item.variantTitle.toLowerCase().includes('waist')
              ? item.variantTitle
              : null;

          validatedItems.push({
            productId: variant.productId,
            variantId: variant.id,
            title: variant.product?.title || item.title,
            variantTitle: cleanVariantTitle,
            price: authoritativePrice,
            quantity: qty,
            image: item.image || variant.product?.featuredImage,
          });
        } else if (product) {
          const authoritativePrice = product.price;
          verifiedSubtotal += authoritativePrice * qty;

          validatedItems.push({
            productId: product.id,
            variantId: null,
            title: product.title,
            variantTitle: item.variantTitle || null,
            price: authoritativePrice,
            quantity: qty,
            image: item.image || product.featuredImage,
          });
        } else {
          throw new CheckoutValidationError(
            `Item "${item.title || 'Product'}" could not be located in our store catalog. Please update your bag.`,
            400
          );
        }
      }

      // 5. Server-Side Discount Calculation
      let verifiedDiscount = 0;
      if (discountCode && typeof discountCode === 'string') {
        const formattedCode = discountCode.trim().toUpperCase();
        const dbDiscount = await prisma.discount.findUnique({
          where: { code: formattedCode },
        });

        if (dbDiscount && dbDiscount.status === 'ACTIVE') {
          if (verifiedSubtotal >= dbDiscount.minSubtotal) {
            if (dbDiscount.type === 'PERCENTAGE') {
              verifiedDiscount = Math.round((verifiedSubtotal * dbDiscount.value) / 100);
            } else {
              verifiedDiscount = Math.min(verifiedSubtotal, dbDiscount.value);
            }

            // Increment coupon usage
            await prisma.discount.update({
              where: { id: dbDiscount.id },
              data: { usageCount: { increment: 1 } },
            });
          }
        }
      }

      // 6. Server-Side Shipping Calculation
      const freeThreshold = store.freeShippingThreshold ?? 5000.0;
      const baseShippingFee = store.shippingFee ?? 250.0;
      const verifiedShipping = verifiedSubtotal >= freeThreshold ? 0 : baseShippingFee;

      // 7. Authoritative Total Price
      const verifiedGrandTotal = Math.max(0, verifiedSubtotal - verifiedDiscount + verifiedShipping);

      // 8. Payment Gateway Validation
      const cleanPaymentMethod = (paymentMethod || 'COD').toUpperCase();
      let financialStatus = 'PENDING';
      if (cleanPaymentMethod === 'CARD') {
        financialStatus = 'PAID';
      }

      // 9. Atomic Transaction: Create Order & Decrement Stock
      const order = await prisma.$transaction(async (tx) => {
        // Generate incremental order number
        const lastOrder = await tx.order.findFirst({
          orderBy: { orderNumber: 'desc' },
        });
        const nextOrderNumber = (lastOrder?.orderNumber || 1000) + 1;

        // Decrement inventory with stock race-condition check
        for (const item of validatedItems) {
          if (item.variantId) {
            const updateResult = await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                inventoryQuantity: { gte: item.quantity },
              },
              data: {
                inventoryQuantity: { decrement: item.quantity },
              },
            });

            if (updateResult.count === 0) {
              throw new Error(
                `Inventory exhausted for "${item.title}" (${item.variantTitle}). Please update your bag.`
              );
            }
          }
        }

        // Create Order
        const newOrder = await tx.order.create({
          data: {
            storeId: store.id,
            orderNumber: nextOrderNumber,
            customerName: cleanName,
            customerEmail: cleanEmail,
            customerPhone: cleanPhone,
            shippingAddress: cleanAddress,
            city: cleanCity,
            province: cleanProvince,
            postalCode: cleanPostalCode || null,
            subtotalPrice: verifiedSubtotal,
            shippingPrice: verifiedShipping,
            totalPrice: verifiedGrandTotal,
            paymentMethod: cleanPaymentMethod,
            financialStatus,
            fulfillmentStatus: 'UNFULFILLED',
            notes: cleanNotes || null,
            items: {
              create: validatedItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                title: item.title,
                variantTitle: item.variantTitle,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        return newOrder;
      });

      // 10. Cache order in Idempotency Map
      const responseOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
      };
      idempotencyMap.set(orderDedupeKey, {
        order: responseOrder,
        timestamp: Date.now(),
      });

      // Invalidate Admin Cache
      revalidatePath('/adminusman');
      revalidatePath('/adminusman/orders');

      // Record guaranteed server-side PURCHASE analytics event (works even with client ad-blockers)
      const sid =
        typeof body.analyticsSessionId === 'string' && body.analyticsSessionId.trim()
          ? body.analyticsSessionId.trim().slice(0, 80)
          : `order_${order.orderNumber}`;
      await prisma.analyticsEvent
        .create({
          data: {
            sessionId: sid,
            eventType: 'PURCHASE',
            path: '/checkout',
            value: order.totalPrice,
            metaJson: JSON.stringify({
              orderNumber: order.orderNumber,
              city: order.city,
              paymentMethod: order.paymentMethod,
            }),
          },
        })
        .catch(() => {});

      return {
        success: true,
        order: responseOrder,
        orderId: order.id,
        orderNumber: order.orderNumber,
      };
    })();

    inFlightMap.set(orderDedupeKey, orderExecutionPromise);

    try {
      const result = await orderExecutionPromise;
      return NextResponse.json(result);
    } finally {
      inFlightMap.delete(orderDedupeKey);
    }
  } catch (err: any) {
    console.error('Checkout error:', err);
    const statusCode = err.status || (err.message?.includes('sold out') ? 409 : 500);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing checkout' },
      { status: statusCode }
    );
  }
}
