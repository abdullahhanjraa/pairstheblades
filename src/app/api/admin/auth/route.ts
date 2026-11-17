import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const MASTER_PASSKEY = (process.env.ADMIN_PASSKEY || 'abdullahhanjra17').trim().toLowerCase();
const AUTH_COOKIE_NAME = 'pairs_admin_auth';
const AUTH_COOKIE_VALUE = 'valid_founder_session_abdullah17';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = token === AUTH_COOKIE_VALUE;

  return NextResponse.json({ authenticated: isAuthenticated });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { passkey } = body;

    if (!passkey || typeof passkey !== 'string') {
      return NextResponse.json(
        { error: 'Please provide the master founder passkey.' },
        { status: 400 }
      );
    }

    const cleanPasskey = passkey.trim().toLowerCase();

    if (cleanPasskey !== MASTER_PASSKEY) {
      // Artificial delay to defend against rapid brute-force dictionary attacks
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json(
        { error: 'Invalid security passkey. Access denied.' },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 Hours Ephemeral Session (Auto-locks on timeout)
    });

    return NextResponse.json({
      success: true,
      message: 'Founder identity verified. Administrative access granted.',
    });
  } catch (err: any) {
    console.error('Admin Auth Error:', err);
    return NextResponse.json(
      { error: err.message || 'Authentication error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);

  return NextResponse.json({
    success: true,
    message: 'Admin session terminated. Terminal locked.',
  });
}
