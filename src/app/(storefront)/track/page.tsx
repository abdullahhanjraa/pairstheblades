'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { formatPKR, formatDate } from '@/lib/formatters';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);

    if (!orderNumber.trim() || !phone.trim()) {
      setError('Please enter both your Order Number and Contact Phone number.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Could not find matching order details.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Connection error tracking order. Please check your internet and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFulfilled = order?.fulfillmentStatus === 'FULFILLED';
  const isPaid = order?.financialStatus === 'PAID';

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Top Header */}
      <section className="border-b border-neutral-100 py-12 px-4 text-center bg-neutral-50/50">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 block mb-2">
          Courier Tracking Desk
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-widest text-black">
          Track Your Order
        </h1>
        <p className="text-xs text-neutral-500 max-w-md mx-auto mt-2">
          Enter your order number and registered phone number to check live courier consignment dispatch status.
        </p>
      </section>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Lookup Form */}
        <div className="p-6 bg-white border border-neutral-200 shadow-xs mb-8">
          <form onSubmit={handleTrackSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Order Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-neutral-400">
                    #
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. 1001"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 border border-neutral-300 text-xs font-mono font-bold focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0321 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 text-xs font-mono focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-extrabold uppercase tracking-[0.2em] transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Locating Parcel...' : 'Check Consignment Status'}</span>
            </button>
          </form>
        </div>

        {/* Live Order Result */}
        {order && (
          <div className="border border-neutral-200 bg-white shadow-sm space-y-6 p-6 animate-in fade-in">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">
                  Found Order
                </span>
                <h2 className="text-xl font-black uppercase tracking-wider text-black font-mono">
                  Order #{order.orderNumber}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>

              <div className="flex flex-col items-end space-y-1">
                <span
                  className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded inline-flex items-center space-x-1.5 ${
                    isFulfilled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isFulfilled ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Dispatched via Courier</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Preparing for Dispatch</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">
                  Payment: {order.paymentMethod} ({order.financialStatus})
                </span>
              </div>
            </div>

            {/* Visual Tracking Progress Rail */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Fulfillment Timeline
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-neutral-100 border border-neutral-200 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center mx-auto text-[10px] font-bold">
                    ✓
                  </div>
                  <p className="font-bold text-black uppercase text-[10px]">Order Received</p>
                  <p className="text-[9px] text-neutral-500">Confirmed in system</p>
                </div>

                <div
                  className={`p-3 border space-y-1 ${
                    isFulfilled
                      ? 'bg-neutral-100 border-neutral-200'
                      : 'bg-black text-white border-black'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-[10px] font-bold ${
                      isFulfilled ? 'bg-black text-white' : 'bg-white text-black animate-pulse'
                    }`}
                  >
                    2
                  </div>
                  <p
                    className={`font-bold uppercase text-[10px] ${
                      isFulfilled ? 'text-black' : 'text-white'
                    }`}
                  >
                    Packaging & QC
                  </p>
                  <p className={`text-[9px] ${isFulfilled ? 'text-neutral-500' : 'text-neutral-300'}`}>
                    14oz Denim Inspected
                  </p>
                </div>

                <div
                  className={`p-3 border space-y-1 ${
                    isFulfilled
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-[10px] font-bold ${
                      isFulfilled ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    3
                  </div>
                  <p className="font-bold uppercase text-[10px]">Dispatched / In Transit</p>
                  <p className="text-[9px]">With Courier Rider</p>
                </div>
              </div>
            </div>

            {/* Courier Tracking Box (if fulfilled) */}
            {isFulfilled && order.trackingCompany && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Courier Consignment Details</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1 font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Logistics Partner:</span>
                    <strong className="text-black text-xs">{order.trackingCompany}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Tracking Number:</span>
                    <strong className="text-black text-xs">{order.trackingNumber}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-800 pt-1">
                  Estimated nationwide delivery: 2-4 business days to your doorstep in <strong>{order.city}</strong>.
                </p>
              </div>
            )}

            {/* Destination summary */}
            <div className="p-4 bg-neutral-50 border border-neutral-100 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Delivery Destination
              </span>
              <p className="font-bold text-black">{order.customerName}</p>
              <p className="text-neutral-600">{order.shippingAddress}</p>
              <p className="font-semibold text-black uppercase">{order.city}, Pakistan</p>
            </div>

            {/* Items Manifest */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Purchased Pieces ({order.items.length})
              </span>
              <div className="divide-y divide-neutral-100 border border-neutral-200">
                {order.items.map((item: any) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      {item.image ? (
                        <div className="relative w-12 h-14 bg-neutral-100 border border-neutral-200 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-14 bg-neutral-100 flex items-center justify-center text-[9px] text-neutral-400">
                          Denim
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-black">{item.title}</p>
                        <p className="text-neutral-500 text-[11px] font-mono">
                          {item.variantTitle || 'Standard'}
                        </p>
                        <p className="text-neutral-400 text-[10px]">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-black">
                      {formatPKR(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Support Help */}
            <div className="pt-2 text-center">
              <a
                href={`https://wa.me/923214455667?text=Salam%20PAIRS%20CLOTHING,%20I%20am%20inquiring%20about%20my%20Order%20%23${order.orderNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-4"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Need urgent delivery help? WhatsApp Support Desk</span>
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
