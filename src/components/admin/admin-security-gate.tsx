'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminSecurityGateProps {
  passwordChanged?: boolean;
  sessionExpired?: boolean;
}

export function AdminSecurityGate({
  passwordChanged = false,
  sessionExpired = false,
}: AdminSecurityGateProps) {
  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkey.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Success: Redirect to the authenticated admin dashboard
        window.location.href = '/adminusman';
      } else {
        setError(data.error || 'Access Denied: Invalid security passkey.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError('Connection error verifying security passkey.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-md border border-neutral-800 bg-neutral-950 p-8 sm:p-10 space-y-6 shadow-2xl relative">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-800 via-white to-neutral-800" />

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border border-neutral-700 bg-neutral-900 flex items-center justify-center mx-auto text-white">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 font-mono block">
              Security Gatekeeper
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-[0.2em] text-white font-sans mt-1">
              PAIRS DROP STUDIO
            </h1>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed font-light">
            Direct administrative access is restricted to store ownership. Enter your Master Founder Passkey to unlock management controls.
          </p>
        </div>

        {/* Password changed confirmation banner */}
        {passwordChanged && !error && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Master password updated! Sign in with your new password below.</span>
          </div>
        )}

        {/* Session expired / rotated banner */}
        {sessionExpired && !passwordChanged && !error && (
          <div className="p-3 bg-amber-950/80 border border-amber-700 text-amber-200 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Session locked (password updated or timed out). Please sign in again.</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Passkey Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1.5 font-mono">
              Master Founder Passkey
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type={showPasskey ? 'text' : 'password'}
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Enter secret passkey..."
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-neutral-900 border border-neutral-700 focus:outline-none focus:border-white text-xs font-mono text-white placeholder-neutral-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPasskey(!showPasskey)}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !passkey.trim()}
            className="w-full py-3 bg-white text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Unlock Admin Terminal</span>
            )}
          </button>
        </form>

        {/* Footer Return */}
        <div className="pt-4 border-t border-neutral-900 text-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
