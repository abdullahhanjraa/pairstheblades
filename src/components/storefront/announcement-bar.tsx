'use client';

import React from 'react';

interface AnnouncementBarProps {
  text?: string;
  enabled?: boolean;
}

export function AnnouncementBar({
  text = 'Nationwide Cash on Delivery across Pakistan. Handcrafted Damascus blades, chef knives, and swords live now!',
  enabled = true,
}: AnnouncementBarProps) {
  if (!enabled) return null;

  // Repeat the item multiple times for seamless marquee scroll
  const items = Array(8).fill(text);

  return (
    <div className="relative w-full overflow-hidden bg-black py-2 text-white border-b border-neutral-800 select-none z-50">
      <div className="animate-ticker flex whitespace-nowrap">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-6 px-4">
            <span className="text-[11px] font-medium tracking-[0.15em] uppercase">
              {item}
            </span>
            <span className="text-[8px] text-neutral-500">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
