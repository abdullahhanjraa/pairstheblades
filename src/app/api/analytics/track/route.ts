import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = new Set([
  'PAGE_VIEW',
  'PRODUCT_VIEW',
  'ADD_TO_CART',
  'CHECKOUT_START',
  'PURCHASE',
]);

// Filter automated crawlers, headless previewers, and link scrapers so visitor counts stay 100% honest
const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|slurp|mediapartners|headlesschrome|lighthouse|pagespeed|vercel|whatsapp|facebookexternalhit|facebot|slackbot|twitterbot|telegrambot|discordbot|linkedinbot|pinterest|preview|curl|wget|playwright|puppeteer|python-requests|go-http-client|axios/i;

export async function POST(req: Request) {
  try {
    const userAgent = req.headers.get('user-agent') || '';
    if (userAgent && BOT_USER_AGENT_PATTERN.test(userAgent)) {
      return NextResponse.json({ ok: true, filtered: true });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: true });
    }

    const eventType = typeof body.eventType === 'string' ? body.eventType.trim().toUpperCase() : '';
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim().slice(0, 80) : '';
    const path = typeof body.path === 'string' ? body.path.trim().slice(0, 200) : null;

    if (!ALLOWED_EVENTS.has(eventType) || !sessionId) {
      return NextResponse.json({ ok: true });
    }

    // Never record admin traffic in customer analytics
    if (path && (path.startsWith('/adminusman') || path.startsWith('/admin'))) {
      return NextResponse.json({ ok: true });
    }

    const productId =
      typeof body.productId === 'string' && body.productId.trim()
        ? body.productId.trim().slice(0, 64)
        : null;
    const value =
      typeof body.value === 'number' && Number.isFinite(body.value) && body.value >= 0
        ? body.value
        : null;
    const metaJson =
      body.meta && typeof body.meta === 'object'
        ? JSON.stringify(body.meta).slice(0, 500)
        : null;

    await prisma.analyticsEvent.create({
      data: {
        sessionId,
        eventType,
        path,
        productId,
        value,
        metaJson,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Analytics track error:', err);
    return NextResponse.json({ ok: true });
  }
}
