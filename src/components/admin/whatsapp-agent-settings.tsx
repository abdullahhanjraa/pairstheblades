'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  Power,
  RefreshCw,
  Unlink,
  KeyRound,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

export interface WhatsAppAgentStatus {
  connected: boolean;
  enabled: boolean;
  userName: string | null;
  maskedToken: string | null;
}

interface WhatsAppAgentSettingsProps {
  initialStatus: WhatsAppAgentStatus;
  storeName: string;
}

export function WhatsAppAgentSettings({
  initialStatus,
  storeName,
}: WhatsAppAgentSettingsProps) {
  const [status, setStatus] = useState<WhatsAppAgentStatus>(initialStatus);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() && !status.connected) {
      setFeedback({
        type: 'error',
        text: 'Please paste your WhatsApp Agent API key first.',
      });
      return;
    }

    setIsConnecting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/whatsapp-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          apiKey: apiKey.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStatus({
          connected: true,
          enabled: Boolean(data.enabled),
          userName: data.userName ?? null,
          maskedToken: data.maskedToken ?? status.maskedToken,
        });
        setApiKey('');
        setFeedback({
          type: 'success',
          text:
            data.message ||
            'WhatsApp Agent connected! Check your WhatsApp chat for the confirmation message.',
        });
      } else {
        setFeedback({
          type: 'error',
          text: data.error || 'Could not connect WhatsApp Agent. Please check your key and try again.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Network error while connecting WhatsApp Agent.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/whatsapp-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          text:
            data.message ||
            'Sample order alert sent! Open your WhatsApp Agent chat to inspect it.',
        });
      } else {
        setFeedback({
          type: 'error',
          text: data.error || 'Could not send test order alert.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Network error while sending test alert.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    setFeedback(null);
    const nextEnabled = !status.enabled;
    try {
      const res = await fetch('/api/admin/whatsapp-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', enabled: nextEnabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus((prev) => ({ ...prev, enabled: Boolean(data.enabled) }));
        setFeedback({
          type: 'success',
          text: data.message || (nextEnabled ? 'Order alerts resumed.' : 'Order alerts paused.'),
        });
      } else {
        setFeedback({
          type: 'error',
          text: data.error || 'Could not update alert status.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Network error updating alert toggle.',
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/whatsapp-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus({
          connected: false,
          enabled: false,
          userName: null,
          maskedToken: null,
        });
        setApiKey('');
        setDisconnectModalOpen(false);
        setFeedback({
          type: 'success',
          text: data.message || 'WhatsApp Agent disconnected.',
        });
      } else {
        setFeedback({
          type: 'error',
          text: data.error || 'Could not disconnect agent.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Network error disconnecting WhatsApp Agent.',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-black" />
            <span>WhatsApp Agent Order Alerts</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Receive every new storefront order automatically inside your private WhatsApp Agent chat — 100% free via the official WhatsApp Agent Platform.
          </p>
        </div>

        <div className="shrink-0">
          {status.connected && status.enabled ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>
                Connected{status.userName ? ` (${status.userName})` : ''} · Live
              </span>
            </span>
          ) : status.connected && !status.enabled ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Connected · Alerts Paused</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-100 border border-neutral-200 text-neutral-600 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <span>Not Connected</span>
            </span>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 border text-xs font-medium flex items-start space-x-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{feedback.text}</span>
        </div>
      )}

      {/* 3-Step Setup Guide */}
      <div className="bg-neutral-50 border border-neutral-200 p-4 space-y-2.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-800">
          How to Connect in 30 Seconds (Free)
        </h3>
        <ol className="space-y-1.5 text-xs text-neutral-600 list-decimal list-inside">
          <li>
            Open WhatsApp → <strong className="text-neutral-900">Settings → Agents → Add an agent</strong> (e.g. name it <span className="font-mono text-neutral-900">Store Orders</span>) and copy its <strong className="text-neutral-900">API key</strong>.
          </li>
          <li>
            Open that new agent&apos;s chat in WhatsApp and send <strong className="text-neutral-900">&quot;Hi&quot;</strong> once (so WhatsApp shares your private chat ID with your store).
          </li>
          <li>
            Paste the API key below and click <strong className="text-neutral-900">Connect Agent</strong> — your store will send an instant confirmation right into WhatsApp.
          </li>
        </ol>
      </div>

      {/* Connection Form */}
      <form
        onSubmit={handleConnect}
        className="bg-white border border-neutral-200 p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label
            htmlFor="whatsapp-agent-key"
            className="block text-xs font-bold uppercase tracking-wider text-neutral-900"
          >
            WhatsApp Agent API Key
          </label>
          {status.maskedToken && (
            <span className="text-[11px] font-mono text-neutral-500">
              Saved key: <strong className="text-neutral-800">{status.maskedToken}</strong>
            </span>
          )}
        </div>

        <div className="relative">
          <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <input
            id="whatsapp-agent-key"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={
              status.connected
                ? 'Paste a new API key only if you rotated/changed your agent...'
                : 'Paste your WhatsApp Agent API key here...'
            }
            className="w-full pl-9 pr-10 py-2.5 border border-neutral-300 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowKey((prev) => !prev)}
            className="absolute right-3 top-2.5 text-neutral-400 hover:text-black transition-colors cursor-pointer"
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-[11px] text-neutral-500 leading-relaxed">
          Your API key is stored securely on the server only and is never exposed to storefront visitors.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="submit"
            disabled={isConnecting || (!apiKey.trim() && !status.connected)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <span>{status.connected ? 'Update & Reconnect Agent' : 'Connect Agent'}</span>
            )}
          </button>

          {status.connected && (
            <>
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-white border border-neutral-300 text-neutral-800 text-xs font-semibold hover:border-black hover:text-black disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isTesting ? 'Sending...' : 'Send Test Order Alert'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggle}
                disabled={isToggling}
                className={`inline-flex items-center space-x-1.5 px-4 py-2.5 border text-xs font-semibold transition-colors cursor-pointer ${
                  status.enabled
                    ? 'bg-white border-neutral-300 text-neutral-700 hover:border-amber-400 hover:text-amber-800'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{status.enabled ? 'Pause Alerts' : 'Resume Alerts'}</span>
              </button>

              <button
                type="button"
                onClick={() => setDisconnectModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-white border border-neutral-200 text-neutral-500 text-xs font-medium hover:border-red-300 hover:text-red-700 hover:bg-red-50/40 transition-colors cursor-pointer sm:ml-auto"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </>
          )}
        </div>
      </form>

      {/* Alert Format Preview */}
      <div className="bg-white border border-neutral-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-800">
            What You Receive on WhatsApp Per Order
          </h3>
          <span className="text-[10px] font-mono text-neutral-400">
            Auto-sent on checkout
          </span>
        </div>
        <div className="bg-neutral-50 border border-neutral-200 p-4 font-mono text-[11px] text-neutral-800 whitespace-pre-line leading-relaxed">
          {`NEW ORDER RECEIVED — #PB-1042\n${storeName || 'Pairs Blades'}\n\nCustomer: Usman Ahmed\nPhone: +923001234567\nCity: Lahore (Punjab)\nAddress: House 14, Block B, Gulberg III\n\nItems:\n• 1× Damascus Steel Chef Knife 8" — Rs. 8,499\n\nPayment: Cash on Delivery (COD)\nSubtotal: Rs. 8,499\nShipping: Free\nTotal: Rs. 8,499\n\nManage order: https://pairstheblades.vercel.app/adminusman/orders`}
        </div>
      </div>

      <ConfirmDialog
        isOpen={disconnectModalOpen}
        title="Disconnect WhatsApp Agent?"
        message="This removes the saved WhatsApp Agent API key from your store settings and stops automatic WhatsApp order notifications until you reconnect an agent."
        confirmText="Disconnect Agent"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDisconnecting}
        onConfirm={handleDisconnect}
        onClose={() => {
          if (!isDisconnecting) setDisconnectModalOpen(false);
        }}
      />
    </div>
  );
}
