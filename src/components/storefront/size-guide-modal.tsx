'use client';

import React from 'react';
import { X } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  if (!isOpen) return null;

  const measurements = [
    { blade: 'Chef Knife 8"', length: '13.2"', spine: '2.5mm', hardness: '60 HRC', weight: '220g' },
    { blade: 'Bowie Blade 10"', length: '15.5"', spine: '4.8mm', hardness: '58 HRC', weight: '450g' },
    { blade: 'Katana Sword 28"', length: '40.5"', spine: '7.0mm', hardness: '59 HRC', weight: '1150g' },
    { blade: 'Santoku 7"', length: '12.0"', spine: '2.0mm', hardness: '61 HRC', weight: '190g' },
    { blade: 'Tanto Dagger 6"', length: '10.8"', spine: '4.0mm', hardness: '60 HRC', weight: '260g' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div>
            <h3 className="text-base font-bold uppercase tracking-[0.15em] text-black">
              Blade Specifications Guide
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Dimensions in inches and millimeters. Damascus and high-carbon steel.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 font-semibold">Blade Model</th>
                <th className="py-2.5 font-semibold">Overall</th>
                <th className="py-2.5 font-semibold">Spine</th>
                <th className="py-2.5 font-semibold">Hardness</th>
                <th className="py-2.5 font-semibold">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-light">
              {measurements.map((m) => (
                <tr key={m.blade} className="hover:bg-neutral-50">
                  <td className="py-3 font-semibold text-black">{m.blade}</td>
                  <td className="py-3 text-neutral-600">{m.length}</td>
                  <td className="py-3 text-neutral-600">{m.spine}</td>
                  <td className="py-3 text-neutral-600">{m.hardness}</td>
                  <td className="py-3 text-neutral-600">{m.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-3.5 bg-neutral-50 rounded-none border border-neutral-100 text-[11px] text-neutral-600 space-y-1">
          <p className="font-semibold text-black">Care Recommendation:</p>
          <p>
            Hand-forged with 200+ alternating layers of 1095 and 15N20 high-carbon steel. Hand-wash and dry immediately after use; oil blade periodically with food-safe mineral oil.
          </p>
        </div>
      </div>
    </div>
  );
}
