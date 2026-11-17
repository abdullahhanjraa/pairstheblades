import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ArrowLeft, MessageCircle, Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  let store: any = null;
  try {
    store = await prisma.store.findFirst();
  } catch (e) {
    console.error(e);
  }

  const storeName = store?.name || 'Pairs Knife & Sword Co.';
  const supportEmail = store?.supportEmail || 'support@pairsblades.com';
  const supportPhone = store?.supportPhone || '+92 300 1234567';
  const supportCity = store?.supportCity || 'Gujranwala, Pakistan';
  const contactAddress = store?.contactAddress || 'Drop Studio, Main Boulevard, Gujranwala, Pakistan';
  const communityLink = store?.communityLink || 'https://whatsapp.com/channel/0029Vb8BubO5K3zVoOAX9B0G';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-left">
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-black uppercase tracking-wider mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Store</span>
      </Link>

      <div className="space-y-8">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-neutral-400 font-medium">
            Get in touch
          </span>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide text-black font-sans mt-1">
            Contact {storeName}
          </h1>
          <p className="text-xs text-neutral-500 mt-2 font-light">
            Questions regarding product specifications, orders, or your courier delivery status? We are available 6 days a week.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* WhatsApp Card */}
          <a
            href={communityLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 border border-neutral-200 bg-white hover:border-black transition-all group space-y-3"
          >
            <div className="flex items-center space-x-2 text-emerald-600">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                VIP Community & WhatsApp
              </span>
            </div>
            <p className="text-xs text-neutral-600 font-light">
              Join our VIP community channel for instant support, drop reminders, and parcel updates.
            </p>
            <span className="text-[11px] font-bold text-black uppercase tracking-wider group-hover:underline inline-block pt-1">
              Join WhatsApp &rarr;
            </span>
          </a>

          {/* Email Support Card */}
          <div className="p-6 border border-neutral-200 bg-white space-y-3">
            <div className="flex items-center space-x-2 text-black">
              <Mail className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Direct Email & Inquiries
              </span>
            </div>
            <p className="text-xs text-neutral-600 font-light">
              For order queries, exchange requests, and corporate inquiries.
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="text-[11px] font-bold text-black uppercase tracking-wider hover:underline inline-block pt-1"
            >
              {supportEmail}
            </a>
          </div>
        </div>

        {/* 7-Day Inspection & Quality Guarantee */}
        <div className="p-6 border border-neutral-200 bg-neutral-50/80 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-neutral-900 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Handcrafted Blade Inspection Guarantee</span>
          </div>
          <p className="text-neutral-600 font-light leading-relaxed">
            Receive your handcrafted blade with full confidence. Every blade, Damascus pattern, edge bevel, and hardwood handle is meticulously inspected prior to dispatch. If you notice any transit damage or issue upon delivery, contact our concierge on WhatsApp with your Order # and we will replace or resolve it immediately.
          </p>
        </div>

        {/* Operating Hours & Dispatch Notice */}
        <div className="bg-neutral-50 p-6 border border-neutral-100 space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-neutral-900 font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-black" />
            <span>Fulfillment Hub Operating Hours</span>
          </div>
          <p className="text-neutral-600 font-light">
            Monday through Saturday: 10:00 AM – 7:00 PM (PKT). Orders placed over the weekend are prepared for Monday morning courier pickup from our {supportCity} hub.
          </p>
          <div className="pt-2 text-neutral-500 font-mono text-[11px]">
            Address: {contactAddress}
          </div>
        </div>
      </div>
    </div>
  );
}
