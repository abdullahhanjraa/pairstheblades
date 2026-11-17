import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { hashPasskey, verifyPasskey } from '@/lib/admin-auth';
import {
  AUTH_COOKIE_NAME,
  createSignedSessionToken,
  verifySignedSessionToken,
} from '@/lib/session-edge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const verified = await verifySignedSessionToken(token);

  if (!verified.valid) {
    return NextResponse.json({ authenticated: false });
  }

  const store = await prisma.store
    .findFirst({ orderBy: { createdAt: 'asc' }, select: { adminSessionVersion: true } })
    .catch(() => null);
  const activeVersion = store?.adminSessionVersion ?? 1;

  return NextResponse.json({
    authenticated: verified.version === activeVersion,
  });
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

    const store = await prisma.store.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, adminPasskeyHash: true, adminSessionVersion: true },
    });

    const isValid = verifyPasskey(passkey, store?.adminPasskeyHash);

    if (!isValid) {
      // Artificial delay to defend against rapid brute-force dictionary attacks
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json(
        { error: 'Invalid security passkey. Access denied.' },
        { status: 401 }
      );
    }

    const sessionVersion = store?.adminSessionVersion ?? 1;
    const signedToken = await createSignedSessionToken(sessionVersion);

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, signedToken, {
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

export async function PUT(req: Request) {
  try {
    // 1. Verify active cryptographic session cookie AND active DB session version
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const verified = await verifySignedSessionToken(token);

    if (!verified.valid) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be signed in to change the master password.' },
        { status: 401 }
      );
    }

    const store = await prisma.store.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, adminPasskeyHash: true, adminSessionVersion: true },
    });

    const activeVersion = store?.adminSessionVersion ?? 1;
    if (verified.version !== activeVersion) {
      cookieStore.delete(AUTH_COOKIE_NAME);
      return NextResponse.json(
        { error: 'Session expired because password was updated elsewhere. Please sign in again.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword, confirmPassword } = body;

    if (
      !currentPassword ||
      typeof currentPassword !== 'string' ||
      !newPassword ||
      typeof newPassword !== 'string' ||
      !confirmPassword ||
      typeof confirmPassword !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Please fill in current password, new password, and confirm password.' },
        { status: 400 }
      );
    }

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (cleanNew.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (cleanNew !== cleanConfirm) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match.' },
        { status: 400 }
      );
    }

    if (cleanNew === cleanCurrent) {
      return NextResponse.json(
        { error: 'New password must be different from your current password.' },
        { status: 400 }
      );
    }

    // 2. Verify current (past) password against active stored hash or fallback
    const isCurrentValid = verifyPasskey(cleanCurrent, store?.adminPasskeyHash);
    if (!isCurrentValid) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json(
        { error: 'Current password is incorrect. Password was not changed.' },
        { status: 401 }
      );
    }

    // 3. Hash new password with salted scrypt AND rotate session version to kill all old sessions globally
    const hashed = hashPasskey(cleanNew);

    if (store) {
      await prisma.store.update({
        where: { id: store.id },
        data: {
          adminPasskeyHash: hashed,
          adminSessionVersion: { increment: 1 },
        },
      });
    } else {
      await prisma.store.create({
        data: {
          adminPasskeyHash: hashed,
          adminSessionVersion: 2,
        },
      });
    }

    // 4. Clear current browser session so founder immediately signs in with the new password
    cookieStore.delete(AUTH_COOKIE_NAME);

    // 5. Revalidate admin routes so UI never shows stale cache
    revalidatePath('/adminusman', 'layout');
    revalidatePath('/adminusman/settings');
    revalidatePath('/adminusman/login');

    return NextResponse.json({
      success: true,
      requiresRelogin: true,
      message: 'Master password updated & all old sessions locked! Redirecting to login...',
    });
  } catch (err: any) {
    console.error('Admin Password Update Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update password' },
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
