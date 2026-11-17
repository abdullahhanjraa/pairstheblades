'use client';

import React from 'react';

interface FloatingWhatsAppProps {
  phone?: string;
  defaultMessage?: string;
  enabled?: boolean;
}

export function FloatingWhatsApp({
  phone = '+923001234567',
  defaultMessage = 'Hi Pairs Cutlery, I would like to inquire about handcrafted blades.',
  enabled = true,
}: FloatingWhatsAppProps) {
  if (!enabled || !phone) return null;

  // Normalize Pakistani and international phone numbers to pure digits for wa.me/
  let cleanNumber = phone.replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '92' + cleanNumber.slice(1);
  } else if (!cleanNumber.startsWith('92') && cleanNumber.length === 10) {
    cleanNumber = '92' + cleanNumber;
  }

  const encodedMessage = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

  return (
    <aside
      aria-label="Direct Customer Support"
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center group animate-in fade-in zoom-in duration-300 print:hidden"
    >
      {/* Floating Tooltip Bubble on Hover */}
      <div
        role="tooltip"
        className="hidden md:flex items-center space-x-1.5 mr-3 px-3 py-1.5 bg-neutral-900 text-white text-[11px] font-semibold tracking-wider uppercase rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Chat on WhatsApp</span>
      </div>

      {/* Floating Action Circular Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Pairs Knife & Sword Co. on WhatsApp"
        className="w-12 h-12 sm:w-14 sm:h-14 bg-black hover:bg-neutral-800 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border border-neutral-700/60 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
      >
        {/* Authentic Crisp WhatsApp Official SVG Glyph */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform group-hover:scale-105"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.16C10.56 20.16 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16ZM16.56 14.39C16.31 14.26 15.09 13.66 14.86 13.58C14.63 13.49 14.47 13.45 14.3 13.7C14.14 13.95 13.67 14.51 13.52 14.68C13.38 14.84 13.23 14.87 12.98 14.74C12.74 14.62 11.95 14.36 11.01 13.52C10.28 12.87 9.78 12.06 9.64 11.81C9.5 11.56 9.62 11.43 9.75 11.3C9.86 11.19 10 11.01 10.12 10.87C10.25 10.72 10.29 10.62 10.37 10.45C10.45 10.29 10.41 10.14 10.35 10.02C10.29 9.89 9.79 8.67 9.59 8.17C9.39 7.69 9.18 7.75 9.03 7.74C8.88 7.74 8.72 7.73 8.55 7.73C8.39 7.73 8.12 7.79 7.89 8.04C7.67 8.29 7.03 8.89 7.03 10.11C7.03 11.33 7.92 12.51 8.04 12.67C8.17 12.84 9.78 15.32 12.24 16.38C12.83 16.63 13.28 16.78 13.64 16.89C14.23 17.08 14.76 17.05 15.19 16.99C15.66 16.92 16.64 16.4 16.85 15.82C17.05 15.24 17.05 14.74 16.99 14.64C16.93 14.53 16.81 14.47 16.56 14.39Z" />
        </svg>
      </a>
    </aside>
  );
}
