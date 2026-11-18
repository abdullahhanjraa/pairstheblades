import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { formatPKR, formatDate } from '@/lib/formatters';
import { CheckCircle2, Package, Truck, ArrowRight, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const { orderNumber } = await searchParams;
  const num = orderNumber ? parseInt(orderNumber, 10) : null;

  let order: any = null;
  let store: any = null;

  try {
    store = await prisma.store.findFirst();
  } catch (e) {
    console.error(e);
  }

  if (num) {
    try {
      order = await prisma.order.findUnique({
        where: { orderNumber: num },
        include: { items: true },
      });
    } catch (e) {
      console.error(e);
    }
  }

  const supportPhoneDigits = (store?.supportPhone || '+92 300 1234567').replace(/\D/g, '');
  const cleanWhatsAppPhone = supportPhoneDigits.startsWith('03')
    ? `92${supportPhoneDigits.slice(1)}`
    : supportPhoneDigits;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-left">
      <div className="bg-white border border-neutral-200 p-6 sm:p-10 shadow-sm space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-3 pb-6 border-b border-neutral-100">
          <CheckCircle2 className="w-8 h-8 text-black flex-shrink-0" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
              Confirmation
            </span>
            <h1 className="text-2xl font-black uppercase tracking-wider text-black font-sans">
              Order Confirmed #{order?.orderNumber || orderNumber || '1001'}
            </h1>
          </div>
        </div>

        {/* Thank You Note */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-black">
            Thank you, {order?.customerName || 'Customer'}!
          </p>
          <p className="text-xs text-neutral-600 font-light leading-relaxed">
            Your order has been received and is being prepared for nationwide dispatch. A tracking link will be sent via SMS to{' '}
            <strong className="text-black font-medium">{order?.customerPhone || 'your phone'}</strong> as soon as the courier scans your package.
          </p>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-neutral-50 p-5 border border-neutral-100 text-xs">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-black mb-1">
              Delivery Address
            </h3>
            <p className="text-neutral-700">{order?.customerName}</p>
            <p className="text-neutral-600">{order?.shippingAddress}</p>
            <p className="text-neutral-600">
              {order?.city}, {order?.province} {order?.postalCode}
            </p>
            <p className="text-neutral-600 mt-1">{order?.customerPhone}</p>
          </div>

          <div>
            <h3 className="font-bold uppercase tracking-wider text-black mb-1">
              Payment & Dispatch
            </h3>
            <p className="text-neutral-700">
              <strong>Method:</strong>{' '}
              {order?.paymentMethod === 'COD'
                ? 'Cash on Delivery (Nationwide)'
                : order?.paymentMethod === 'BANK_TRANSFER'
                ? 'Direct Bank Transfer (Raast / IBAN)'
                : order?.paymentMethod === 'INTERNATIONAL_TRANSFER'
                ? store?.internationalTitle || 'International Transfer (Payoneer / PayPal / Wise)'
                : 'Credit / Debit Card (Online)'}
            </p>
            <p className="text-neutral-600">
              <strong>Status:</strong> {order?.financialStatus || 'PENDING'}
            </p>
            <p className="text-neutral-600">
              <strong>Fulfillment:</strong> {order?.fulfillmentStatus || 'UNFULFILLED'}
            </p>
            <p className="text-neutral-400 mt-1 text-[11px]">
              Placed on: {order ? formatDate(order.createdAt) : 'Today'}
            </p>
          </div>
        </div>

        {/* Bank Transfer Instructions Box */}
        {order?.paymentMethod === 'BANK_TRANSFER' && (
          <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-xs space-y-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-bold uppercase tracking-wider text-black">
                Direct Bank Transfer Instructions
              </h3>
            </div>
            <p className="text-neutral-700 leading-relaxed font-light">
              Please transfer the total order amount of{' '}
              <strong className="text-black font-extrabold">{formatPKR(order.totalPrice)}</strong>{' '}
              to the following official store account:
            </p>

            <div className="bg-white p-3.5 border border-amber-200 font-mono text-xs space-y-1.5">
              <p>
                <span className="text-neutral-400 font-sans uppercase font-bold text-[10px] block">
                  Bank & Branch:
                </span>{' '}
                <span className="font-bold text-black">{store?.bankName || 'Meezan Bank Ltd'}</span>{' '}
                {store?.bankBranch && (
                  <span className="font-normal text-neutral-500 font-sans">
                    ({store.bankBranch})
                  </span>
                )}
              </p>
              <p>
                <span className="text-neutral-400 font-sans uppercase font-bold text-[10px] block">
                  Account Title:
                </span>{' '}
                <span className="font-bold text-black">{store?.bankAccountTitle || 'PAIRS KNIFE & SWORD CO.'}</span>
              </p>
              <p>
                <span className="text-neutral-400 font-sans uppercase font-bold text-[10px] block">
                  Account Number:
                </span>{' '}
                <span className="font-bold text-black">{store?.bankAccountNumber || '01020304050607'}</span>
              </p>
              <p>
                <span className="text-neutral-400 font-sans uppercase font-bold text-[10px] block">
                  IBAN (Raast / All Banks):
                </span>{' '}
                <span className="font-bold text-black break-all">{store?.bankIban || 'PK36MEZN0001020304050607'}</span>
              </p>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-[11px] text-neutral-600">
                After transfer, take a screenshot of the transaction receipt and send it to our WhatsApp team.
              </p>
              <a
                href={`https://wa.me/${cleanWhatsAppPhone}?text=${encodeURIComponent(
                  `Hi ${store?.name || 'Pairs Knife & Sword Co.'}! Here is my payment receipt for Order #${order.orderNumber} (Rs. ${order.totalPrice}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[11px] transition-colors whitespace-nowrap shadow-xs"
              >
                Send Receipt via WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* International Transfer Instructions Box */}
        {order?.paymentMethod === 'INTERNATIONAL_TRANSFER' && (
          <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-xs space-y-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-bold uppercase tracking-wider text-black">
                {store?.internationalTitle || 'International Transfer Instructions'}
              </h3>
            </div>
            <p className="text-neutral-700 leading-relaxed font-light">
              Please transfer the total order amount of{' '}
              <strong className="text-black font-extrabold">{formatPKR(order.totalPrice)}</strong>{' '}
              using one of the international transfer methods below:
            </p>

            {(store?.payoneerAccount?.trim() ||
              store?.paypalAccount?.trim() ||
              store?.wiseAccount?.trim()) ? (
              <div className="bg-white p-3.5 border border-amber-200 font-mono text-xs space-y-2">
                {store?.payoneerAccount?.trim() && (
                  <p>
                    <span className="text-neutral-400 font-sans uppercase font-bold text-[10px] block">
                      Payoneer Account / Email:
                    </span>{' '}
                    <span className="font-bold text-black break-all">{store.payoneerAccount}</span>
                  </p>
                )}
                {store?.paypalAccount?.trim() && (
                  <p>
                    <span className="text-neutral-400 font-sans uppercase font-bold text-[10px] block">
                      PayPal Email / PayPal.me:
                    </span>{' '}
                    <span className="font-bold text-black break-all">{store.paypalAccount}</span>
                  </p>
                )}
                {store?.wiseAccount?.trim() && (
                  <p>
                    <span className="text-neutral-400 font-sans uppercase font-bold text-[10px] block">
                      Wise / SWIFT / Other:
                    </span>{' '}
                    <span className="font-bold text-black break-all">{store.wiseAccount}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white p-3.5 border border-amber-200 text-xs text-neutral-700">
                Tap the WhatsApp button below with your Order # to receive our live Payoneer / PayPal / Wise payment link immediately.
              </div>
            )}

            <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-[11px] text-neutral-600">
                {store?.internationalInstructions ||
                  'After transfer, share your payment receipt screenshot with your Order # on WhatsApp.'}
              </p>
              <a
                href={`https://wa.me/${cleanWhatsAppPhone}?text=${encodeURIComponent(
                  `Hi ${store?.name || 'Pairs Knife & Sword Co.'}! I placed Order #${order.orderNumber} (${formatPKR(order.totalPrice)}) via International Transfer (Payoneer / PayPal / Wise).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[11px] transition-colors whitespace-nowrap shadow-xs"
              >
                Send Receipt via WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Items */}
        {order?.items && order.items.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-black">
              Items in this Shipment
            </h3>
            <div className="divide-y divide-neutral-100 border-t border-b border-neutral-100">
              {order.items.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {item.image && (
                      <div className="relative w-12 h-12 bg-neutral-50 border border-neutral-200 rounded-xs flex-shrink-0 p-0.5">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-black">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {item.variantTitle ? `${item.variantTitle} × ` : 'Qty: '}{item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-black">
                    {formatPKR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs text-right pt-2">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatPKR(order.subtotalPrice)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span>{order.shippingPrice === 0 ? 'FREE' : formatPKR(order.shippingPrice)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-black pt-2 border-t border-neutral-200">
                <span>Total Amount Due</span>
                <span>{formatPKR(order.totalPrice)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-6 border-t border-neutral-200">
          <Link
            href="/"
            className="block w-full py-4 bg-black text-white text-center text-xs font-extrabold uppercase tracking-[0.25em] hover:bg-neutral-800 transition-colors shadow-md"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
