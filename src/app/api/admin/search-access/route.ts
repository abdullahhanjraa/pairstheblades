import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyPasskey } from '@/lib/admin-auth';
import { AUTH_COOKIE_NAME, createSignedSessionToken } from '@/lib/session-edge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Silent server-side verification for the storefront search bar.
 * Always returns HTTP 200 so normal customer searches never log 401 console errors.
 * Checks the query dynamically against the live encrypted password in Supabase PostgreSQL
 * (zero hardcoded passwords in client code — updates automatically when password changes).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === 'string' ? body.query.trim() : '';

    if (!query || query.length < 6) {
      return NextResponse.json({ granted: false });
    }

    const store = await prisma.store.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, adminPasskeyHash: true, adminSessionVersion: true },
    });

    const isValid = verifyPasskey(query, store?.adminPasskeyHash);
    if (!isValid) {
      return NextResponse.json({ granted: false });
    }

    const sessionVersion = store?.adminSessionVersion ?? 1;
    const signedToken = await createSignedSessionToken(sessionVersion);

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 Hours Ephemeral Session
    });

    return NextResponse.json({
      granted: true,
      redirectTo: '/adminusman',
    });
  } catch (err) {
    console.error('Search access verification error:', err);
    return NextResponse.json({ granted: false });
  }
}
