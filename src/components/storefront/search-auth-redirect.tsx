'use client';

import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export function SearchAuthRedirect({ query }: { query: string }) {
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/search-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        if (!active) return;
        const data = await res.json().catch(() => ({}));
        if (data?.granted && data?.redirectTo) {
          window.location.replace(data.redirectTo);
          return;
        }
      } catch {
        // Fallback below
      }
      if (active) {
        window.location.replace('/adminusman/login');
      }
    })();

    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-center px-4">
      <RefreshCw className="w-5 h-5 animate-spin text-black" />
      <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-600">
        Verifying Founder Access...
      </p>
    </div>
  );
}
