import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'pairs_admin_auth';
const AUTH_COOKIE_VALUE = 'valid_founder_session_abdullah17';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public auth endpoints and login page
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/auth')) {
    // If user is already authenticated and visits /admin/login, forward to /admin
    if (pathname === '/admin/login') {
      const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
      if (authCookie?.value === AUTH_COOKIE_VALUE) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Check session authentication
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const isAuthorized = authCookie?.value === AUTH_COOKIE_VALUE;

  // 3. Protect all admin pages (/admin, /admin/products, /admin/orders, /admin/settings, etc.)
  if (pathname.startsWith('/admin')) {
    if (!isAuthorized) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Protect all admin internal APIs (/api/admin/products, /api/admin/orders, etc.)
  if (pathname.startsWith('/api/admin')) {
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin session required. Please authenticate at /admin/login.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
