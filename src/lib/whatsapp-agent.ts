import { prisma } from '@/lib/db';

const WHATSAPP_AGENT_BASE_URL = 'https://api.whatsapp.com/agent/v1';
const MAX_TEXT_LENGTH = 4096;

export interface WhatsAppDiscoveryResult {
  ok: boolean;
  recipientId?: string;
  profileName?: string | null;
  code?: 'INVALID_TOKEN' | 'NO_MESSAGE_YET' | 'RATE_LIMITED' | 'API_ERROR' | 'NETWORK_ERROR';
  error?: string;
}

export interface WhatsAppSendResult {
  ok: boolean;
  messageId?: string;
  recipientId?: string;
  httpStatus?: number;
  errorCode?: number;
  error?: string;
}

export interface OrderAlertPayload {
  orderNumber: string | number;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  province?: string | null;
  postalCode?: string | null;
  subtotalPrice: number;
  shippingPrice: number;
  totalPrice: number;
  paymentMethod: string;
  financialStatus?: string | null;
  notes?: string | null;
  items: Array<{
    title: string;
    variantTitle?: string | null;
    quantity: number;
    price: number;
  }>;
}

export function maskWhatsAppAgentToken(token?: string | null): string | null {
  if (!token || !token.trim()) return null;
  const clean = token.trim();
  if (clean.length <= 6) return '••••••';
  return `••••••${clean.slice(-4)}`;
}

function formatPKRPlain(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

function humanizePaymentMethod(method: string, financialStatus?: string | null): string {
  const upper = (method || '').toUpperCase();
  if (upper === 'COD') return 'Cash on Delivery (COD)';
  if (upper === 'BANK_TRANSFER') return 'Bank Transfer / Raast';
  if (upper === 'PAYONEER') return 'Payoneer (International Payment)';
  if (upper === 'INTERNATIONAL_TRANSFER') return 'International Transfer (PayPal / Wise)';
  if (upper === 'CARD') {
    return financialStatus === 'PAID' ? 'Card Payment (Paid)' : 'Card Payment';
  }
  return method || 'COD';
}

function toWhatsAppLink(rawPhone: string): string | null {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (digits.length < 7) return null;
  const intl = digits.startsWith('03') && digits.length === 11 ? `92${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

/**
 * Formats a clean, mobile-friendly WhatsApp order alert using WhatsApp markdown (*bold*).
 * Strictly stays under the official 4096-character limit.
 */
export function formatOrderAlertMessage(
  order: OrderAlertPayload,
  storeName: string,
  adminOrdersUrl: string,
  isTest = false
): string {
  const headerTag = isTest ? '*TEST ORDER ALERT*' : '*NEW ORDER RECEIVED*';
  const realEmail =
    order.customerEmail && !order.customerEmail.toLowerCase().endsWith('@pairs.pk')
      ? order.customerEmail.trim()
      : null;

  // Prefer explicit Direct WhatsApp from notes if customer entered a separate WhatsApp number
  const directWaMatch = order.notes?.match(/Direct WhatsApp:\s*([^|]+)/i);
  const preferredWaPhone = directWaMatch ? directWaMatch[1].trim() : order.customerPhone;
  const waLink = toWhatsAppLink(preferredWaPhone);

  const lines: string[] = [
    `${headerTag} — *#${order.orderNumber}*`,
    `_${storeName}_`,
    '',
    `*Customer:* ${order.customerName}`,
    `*Phone:* ${order.customerPhone}`,
    ...(realEmail ? [`*Email:* ${realEmail}`] : []),
    ...(waLink ? [`*WhatsApp Buyer:* ${waLink}`] : []),
    `*City:* ${order.city}${order.province ? ` (${order.province})` : ''}`,
    `*Address:* ${order.shippingAddress}${order.postalCode ? `, ${order.postalCode}` : ''}`,
    '',
    '*Items:*',
  ];

  for (const item of order.items) {
    const variantLabel =
      item.variantTitle && item.variantTitle.toLowerCase() !== 'default title'
        ? ` (${item.variantTitle})`
        : '';
    const lineTotal = item.price * item.quantity;
    lines.push(`• ${item.quantity}× ${item.title}${variantLabel} — ${formatPKRPlain(lineTotal)}`);
  }

  const discountAmount = Math.max(
    0,
    Math.round(order.subtotalPrice + order.shippingPrice - order.totalPrice)
  );

  lines.push('');
  lines.push(`*Payment:* ${humanizePaymentMethod(order.paymentMethod, order.financialStatus)}`);
  lines.push(`*Subtotal:* ${formatPKRPlain(order.subtotalPrice)}`);
  lines.push(
    `*Shipping:* ${order.shippingPrice <= 0 ? 'Free' : formatPKRPlain(order.shippingPrice)}`
  );
  if (discountAmount > 0) {
    lines.push(`*Discount:* -${formatPKRPlain(discountAmount)}`);
  }
  lines.push(`*Total:* *${formatPKRPlain(order.totalPrice)}*`);

  if (order.notes && order.notes.trim()) {
    lines.push('');
    lines.push(`*Note:* ${order.notes.trim()}`);
  }

  lines.push('');
  lines.push(`Manage order: ${adminOrdersUrl}`);

  const fullText = lines.join('\n');
  if (fullText.length <= MAX_TEXT_LENGTH) return fullText;
  return `${fullText.slice(0, MAX_TEXT_LENGTH - 3)}...`;
}

/**
 * Polls GET /agent/v1/updates?offset=0&limit=50&timeout=<sec> to discover the
 * agent creator's opaque participant identifier (`user:<id>`) and optional profile name.
 */
export async function discoverWhatsAppAgentRecipient(
  rawToken: string,
  timeoutSec = 3
): Promise<WhatsAppDiscoveryResult> {
  const token = rawToken.trim();
  if (!token) {
    return {
      ok: false,
      code: 'INVALID_TOKEN',
      error: 'Please paste your WhatsApp Agent API key first.',
    };
  }

  const safeTimeout = Math.max(0, Math.min(25, Math.floor(timeoutSec)));
  const url = `${WHATSAPP_AGENT_BASE_URL}/updates?offset=0&limit=50&timeout=${safeTimeout}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout((safeTimeout + 10) * 1000),
    });

    if (res.status === 204) {
      return {
        ok: false,
        code: 'NO_MESSAGE_YET',
        error:
          'Your API key is valid, but you have not messaged this agent yet. Open your agent chat in WhatsApp, send "Hi", then click Connect again.',
      };
    }

    const data = await res.json().catch(() => null);

    if (res.status === 401 || (res.status === 400 && data?.error?.code === 100)) {
      return {
        ok: false,
        code: 'INVALID_TOKEN',
        error:
          'Invalid WhatsApp Agent API key. Open WhatsApp → Settings → Agents → your agent → API key and copy the exact key.',
      };
    }

    if (res.status === 429) {
      return {
        ok: false,
        code: 'RATE_LIMITED',
        error: 'WhatsApp rate limit reached (15 checks/min). Please wait 15 seconds and try again.',
      };
    }

    if (!res.ok) {
      const apiMsg =
        data?.error?.error_data?.details ||
        data?.error?.message ||
        `WhatsApp returned HTTP ${res.status}.`;
      return {
        ok: false,
        code: 'API_ERROR',
        error: apiMsg,
      };
    }

    // Extract latest `user:<id>` from messages[] or contacts[] per WhatsApp Agent Platform manual
    let recipientId: string | undefined;
    let profileName: string | null = null;

    const entries = Array.isArray(data?.entry) ? data.entry : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value;
        if (!value) continue;

        const contacts = Array.isArray(value.contacts) ? value.contacts : [];
        for (const contact of contacts) {
          if (typeof contact?.wa_id === 'string' && contact.wa_id.startsWith('user:')) {
            recipientId = contact.wa_id;
          }
          if (typeof contact?.profile?.name === 'string' && contact.profile.name.trim()) {
            profileName = contact.profile.name.trim();
          }
        }

        const messages = Array.isArray(value.messages) ? value.messages : [];
        for (const msg of messages) {
          if (typeof msg?.from === 'string' && msg.from.startsWith('user:')) {
            recipientId = msg.from;
          }
        }

        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        for (const st of statuses) {
          if (!recipientId && typeof st?.recipient_id === 'string' && st.recipient_id.startsWith('user:')) {
            recipientId = st.recipient_id;
          }
        }
      }
    }

    if (!recipientId) {
      return {
        ok: false,
        code: 'NO_MESSAGE_YET',
        error:
          'Your API key works, but no WhatsApp chat message was found yet. Send "Hi" to your agent inside WhatsApp, then click Connect again.',
      };
    }

    return {
      ok: true,
      recipientId,
      profileName,
    };
  } catch (err: any) {
    console.error('[WhatsApp Agent] Discovery error:', err);
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      error: 'Could not reach WhatsApp Agent API right now. Please try again in a moment.',
    };
  }
}

/**
 * Sends a plain text message via POST https://api.whatsapp.com/agent/v1/messages.
 * Retries once on HTTP 503 with error.code 131016 (explicitly safe per manual).
 */
export async function sendWhatsAppAgentText(
  rawToken: string,
  recipientId: string,
  bodyText: string
): Promise<WhatsAppSendResult> {
  const token = rawToken.trim();
  const safeBody =
    bodyText.length > MAX_TEXT_LENGTH
      ? `${bodyText.slice(0, MAX_TEXT_LENGTH - 3)}...`
      : bodyText;

  const attemptSend = async (): Promise<WhatsAppSendResult> => {
    try {
      const res = await fetch(`${WHATSAPP_AGENT_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientId,
          type: 'text',
          text: {
            body: safeBody,
            preview_url: false,
          },
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        return {
          ok: true,
          messageId: data?.messages?.[0]?.id,
          recipientId: data?.contacts?.[0]?.wa_id || recipientId,
          httpStatus: res.status,
        };
      }

      const errorCode = typeof data?.error?.code === 'number' ? data.error.code : undefined;
      const details =
        data?.error?.error_data?.details ||
        data?.error?.message ||
        `WhatsApp Agent API returned HTTP ${res.status}`;

      return {
        ok: false,
        httpStatus: res.status,
        errorCode,
        error: details,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Network timeout contacting WhatsApp Agent API.',
      };
    }
  };

  const first = await attemptSend();
  if (first.ok) return first;

  // Manual page 9 & 26: 503 + error.code 131016 guarantees message was NOT sent -> safe to retry once
  if (first.httpStatus === 503 && first.errorCode === 131016) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return attemptSend();
  }

  return first;
}

/**
 * Automatic non-blocking order notifier called after a live checkout succeeds.
 * Self-heals if the store owner's `user:<id>` rotated (e.g. phone number change).
 */
export async function notifyOwnerOfNewOrder(
  order: OrderAlertPayload,
  siteOrigin?: string
): Promise<WhatsAppSendResult | null> {
  try {
    const store = await prisma.store.findFirst({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        whatsappAgentEnabled: true,
        whatsappAgentToken: true,
        whatsappAgentRecipientId: true,
      },
    });

    if (!store?.whatsappAgentEnabled || !store.whatsappAgentToken?.trim()) {
      return null;
    }

    const token = store.whatsappAgentToken.trim();
    let recipientId = store.whatsappAgentRecipientId?.trim() || '';

    // If recipientId is somehow missing, attempt one quick non-blocking lookup
    if (!recipientId) {
      const discovered = await discoverWhatsAppAgentRecipient(token, 0);
      if (!discovered.ok || !discovered.recipientId) {
        console.warn('[WhatsApp Agent] Skipping order alert: recipient not paired yet.');
        return null;
      }
      recipientId = discovered.recipientId;
      await prisma.store
        .update({
          where: { id: store.id },
          data: {
            whatsappAgentRecipientId: recipientId,
            ...(discovered.profileName ? { whatsappAgentUserName: discovered.profileName } : {}),
          },
        })
        .catch(() => {});
    }

    const baseUrl = (siteOrigin || process.env.NEXT_PUBLIC_SITE_URL || 'https://pairstheblades.vercel.app').replace(
      /\/$/,
      ''
    );
    const message = formatOrderAlertMessage(
      order,
      store.name || 'Pairs Blades',
      `${baseUrl}/adminusman/orders`,
      false
    );

    const sent = await sendWhatsAppAgentText(token, recipientId, message);

    // Self-heal once if recipient user:<id> changed (manual page 5 "Stability")
    if (
      !sent.ok &&
      (sent.errorCode === 131005 || sent.errorCode === 131009 || sent.httpStatus === 403)
    ) {
      const refreshed = await discoverWhatsAppAgentRecipient(token, 0);
      if (refreshed.ok && refreshed.recipientId && refreshed.recipientId !== recipientId) {
        await prisma.store
          .update({
            where: { id: store.id },
            data: {
              whatsappAgentRecipientId: refreshed.recipientId,
              ...(refreshed.profileName ? { whatsappAgentUserName: refreshed.profileName } : {}),
            },
          })
          .catch(() => {});
        return sendWhatsAppAgentText(token, refreshed.recipientId, message);
      }
    }

    if (!sent.ok) {
      console.error('[WhatsApp Agent] Order alert delivery failed:', sent);
    }

    return sent;
  } catch (err) {
    console.error('[WhatsApp Agent] Unexpected error sending order alert:', err);
    return null;
  }
}
