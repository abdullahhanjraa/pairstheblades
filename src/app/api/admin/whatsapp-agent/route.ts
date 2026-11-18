import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { AUTH_COOKIE_NAME, verifySignedSessionToken } from '@/lib/session-edge';
import {
  discoverWhatsAppAgentRecipient,
  formatOrderAlertMessage,
  maskWhatsAppAgentToken,
  sendWhatsAppAgentText,
} from '@/lib/whatsapp-agent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function requireAdminStore() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const verified = await verifySignedSessionToken(token);

  if (!verified.valid) {
    return { error: NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 }) };
  }

  const store = await prisma.store.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!store) {
    return { error: NextResponse.json({ error: 'Store record not found.' }, { status: 404 }) };
  }

  if (verified.version !== (store.adminSessionVersion ?? 1)) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized: Session expired. Please sign in again.' },
        { status: 401 }
      ),
    };
  }

  return { store };
}

/**
 * POST /api/admin/whatsapp-agent
 * Authenticated admin endpoint to connect, test, toggle, or disconnect the official
 * WhatsApp Agent Platform (`https://api.whatsapp.com/agent/v1`) order alert integration.
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAdminStore();
    if ('error' in auth && auth.error) return auth.error;
    const { store } = auth;

    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === 'string' ? body.action : '';

    // Derive site origin for clickable admin order links in alerts
    const reqUrl = new URL(req.url);
    const origin = `${reqUrl.protocol}//${reqUrl.host}`;

    // 1. CONNECT: Verify token via GET /agent/v1/updates, discover user:<id>, save & send welcome alert
    if (action === 'connect') {
      const suppliedKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';
      const tokenToUse = suppliedKey || store.whatsappAgentToken?.trim() || '';

      if (!tokenToUse) {
        return NextResponse.json(
          { error: 'Please paste your WhatsApp Agent API key from WhatsApp → Settings → Agents.' },
          { status: 400 }
        );
      }

      const discovered = await discoverWhatsAppAgentRecipient(tokenToUse, 4);
      if (!discovered.ok || !discovered.recipientId) {
        const status =
          discovered.code === 'RATE_LIMITED'
            ? 429
            : discovered.code === 'NETWORK_ERROR' || discovered.code === 'API_ERROR'
              ? 502
              : 400;
        return NextResponse.json(
          {
            error: discovered.error || 'Could not connect to WhatsApp Agent.',
            code: discovered.code,
          },
          { status }
        );
      }

      const storeLabel = store.name || 'Your Store';
      const welcomeText = [
        `*${storeLabel} — WhatsApp Order Alerts Connected*`,
        '',
        'Your store is now linked to this WhatsApp Agent.',
        'Every time a customer places an order, the full order summary (items, phone, city, address & total) will arrive right here automatically.',
        '',
        `Orders dashboard: ${origin}/adminusman/orders`,
      ].join('\n');

      const welcomeSend = await sendWhatsAppAgentText(
        tokenToUse,
        discovered.recipientId,
        welcomeText
      );

      if (!welcomeSend.ok) {
        return NextResponse.json(
          {
            error: `Account detected, but test welcome message failed: ${welcomeSend.error || 'Unknown error'}`,
          },
          { status: 502 }
        );
      }

      const updated = await prisma.store.update({
        where: { id: store.id },
        data: {
          whatsappAgentToken: tokenToUse,
          whatsappAgentRecipientId: discovered.recipientId,
          whatsappAgentUserName: discovered.profileName ?? store.whatsappAgentUserName ?? null,
          whatsappAgentEnabled: true,
        },
      });

      revalidatePath('/adminusman/settings');

      return NextResponse.json({
        success: true,
        connected: true,
        enabled: updated.whatsappAgentEnabled,
        userName: updated.whatsappAgentUserName,
        maskedToken: maskWhatsAppAgentToken(updated.whatsappAgentToken),
        messageId: welcomeSend.messageId,
        message: 'WhatsApp Agent connected! Check your WhatsApp chat for the confirmation message.',
      });
    }

    // 2. TEST: Send a realistic sample order alert straight to the connected WhatsApp Agent
    if (action === 'test') {
      const token = store.whatsappAgentToken?.trim();
      let recipientId = store.whatsappAgentRecipientId?.trim();

      if (!token) {
        return NextResponse.json(
          { error: 'No WhatsApp Agent API key connected yet. Paste your API key and click Connect first.' },
          { status: 400 }
        );
      }

      if (!recipientId) {
        const discovered = await discoverWhatsAppAgentRecipient(token, 2);
        if (!discovered.ok || !discovered.recipientId) {
          return NextResponse.json(
            { error: discovered.error || 'Please send "Hi" to your agent in WhatsApp and reconnect.' },
            { status: 400 }
          );
        }
        recipientId = discovered.recipientId;
        await prisma.store.update({
          where: { id: store.id },
          data: {
            whatsappAgentRecipientId: recipientId,
            ...(discovered.profileName ? { whatsappAgentUserName: discovered.profileName } : {}),
          },
        });
      }

      const sampleMessage = formatOrderAlertMessage(
        {
          orderNumber: 'TEST-1001',
          customerName: 'Usman Ahmed (Sample)',
          customerPhone: '+923001234567',
          shippingAddress: 'House 14, Block B, Gulberg III',
          city: 'Lahore',
          province: 'Punjab',
          subtotalPrice: 8499,
          shippingPrice: 0,
          totalPrice: 8499,
          paymentMethod: 'COD',
          financialStatus: 'PENDING',
          notes: 'Call before delivery',
          items: [
            {
              title: 'Damascus Steel Chef Knife 8"',
              variantTitle: 'Standard',
              quantity: 1,
              price: 8499,
            },
          ],
        },
        store.name || 'Pairs Blades',
        `${origin}/adminusman/orders`,
        true
      );

      const sent = await sendWhatsAppAgentText(token, recipientId, sampleMessage);
      if (!sent.ok) {
        return NextResponse.json(
          { error: sent.error || 'Failed to send test alert to WhatsApp Agent.' },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        messageId: sent.messageId,
        message: 'Sample order alert delivered! Open your WhatsApp Agent chat to preview it.',
      });
    }

    // 3. TOGGLE: Pause or resume automatic order alerts without wiping credentials
    if (action === 'toggle') {
      const nextEnabled = Boolean(body?.enabled);
      if (nextEnabled && (!store.whatsappAgentToken || !store.whatsappAgentRecipientId)) {
        return NextResponse.json(
          { error: 'Connect your WhatsApp Agent API key before enabling alerts.' },
          { status: 400 }
        );
      }

      const updated = await prisma.store.update({
        where: { id: store.id },
        data: { whatsappAgentEnabled: nextEnabled },
      });

      revalidatePath('/adminusman/settings');

      return NextResponse.json({
        success: true,
        enabled: updated.whatsappAgentEnabled,
        message: nextEnabled
          ? 'Automatic WhatsApp order alerts are now ACTIVE.'
          : 'Automatic WhatsApp order alerts have been paused.',
      });
    }

    // 4. DISCONNECT: Clear saved API key & recipient ID cleanly
    if (action === 'disconnect') {
      await prisma.store.update({
        where: { id: store.id },
        data: {
          whatsappAgentEnabled: false,
          whatsappAgentToken: null,
          whatsappAgentRecipientId: null,
          whatsappAgentUserName: null,
        },
      });

      revalidatePath('/adminusman/settings');

      return NextResponse.json({
        success: true,
        connected: false,
        enabled: false,
        message: 'WhatsApp Agent disconnected and API key removed from store settings.',
      });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (err: any) {
    console.error('[WhatsApp Agent API] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error handling WhatsApp Agent action.' },
      { status: 500 }
    );
  }
}
