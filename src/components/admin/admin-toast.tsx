'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface AdminToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function AdminToastContainer({ toasts, onDismiss }: AdminToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const config = {
    success: {
      border: 'border-emerald-600/40 bg-neutral-950 text-white',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
      tag: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    },
    error: {
      border: 'border-red-600/40 bg-neutral-950 text-white',
      icon: <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
      tag: 'bg-red-950/80 text-red-300 border-red-800',
    },
    warning: {
      border: 'border-amber-600/40 bg-neutral-950 text-white',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
      tag: 'bg-amber-950/80 text-amber-300 border-amber-800',
    },
    info: {
      border: 'border-neutral-700 bg-neutral-950 text-white',
      icon: <Info className="w-4 h-4 text-neutral-300 flex-shrink-0" />,
      tag: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    },
  }[toast.type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto p-4 border ${config.border} shadow-2xl rounded-xs flex items-start space-x-3 text-xs animate-in slide-in-from-bottom-3 duration-200 transition-all`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <p className="font-extrabold uppercase tracking-wider text-[11px] text-white">
            {toast.title}
          </p>
        )}
        <p className="text-neutral-300 text-[11px] leading-relaxed break-words mt-0.5">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-neutral-400 hover:text-white p-0.5 transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
