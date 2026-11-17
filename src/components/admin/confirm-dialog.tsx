'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, X, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requiredConfirmationText?: string; // e.g. "RESET" for database purge
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  requiredConfirmationText,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setTypedText('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const canConfirm =
    !requiredConfirmationText ||
    typedText.trim().toUpperCase() === requiredConfirmationText.toUpperCase();

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white border border-neutral-300 shadow-2xl p-6 sm:p-7 space-y-5 text-left relative animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-full ${
                isDanger
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              {isDanger ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-black font-sans">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-neutral-400 hover:text-black transition-colors p-1 cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed font-light">
          {message}
        </p>

        {requiredConfirmationText && (
          <div className="space-y-1.5 pt-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700">
              Type <strong className="text-red-700">{requiredConfirmationText}</strong> to confirm:
            </label>
            <input
              type="text"
              autoFocus
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={requiredConfirmationText}
              className="w-full p-2 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-red-600 uppercase"
            />
          </div>
        )}

        <div className="pt-3 border-t border-neutral-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || isLoading}
            className={`px-4 py-2 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDanger
                ? 'bg-red-700 hover:bg-red-800'
                : 'bg-black hover:bg-neutral-800'
            }`}
          >
            {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
