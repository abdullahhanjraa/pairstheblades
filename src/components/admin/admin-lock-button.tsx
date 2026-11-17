'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, RefreshCw } from 'lucide-react';

export function AdminLockButton() {
  const router = useRouter();
  const [isLocking, setIsLocking] = useState(false);

  const handleLock = async () => {
    setIsLocking(true);
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      window.location.href = '/adminusman/login';
    } catch (e) {
      console.error('Error locking session', e);
      window.location.href = '/adminusman/login';
    }
  };

  return (
    <button
      type="button"
      onClick={handleLock}
      disabled={isLocking}
      className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-red-950/80 hover:text-red-300 text-neutral-300 text-xs font-semibold rounded border border-neutral-700/50 transition-colors cursor-pointer"
      title="Immediately lock the admin panel and clear authentication session"
    >
      {isLocking ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Lock className="w-3.5 h-3.5" />
      )}
      <span>Lock Terminal</span>
    </button>
  );
}
