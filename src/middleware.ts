import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'pairs_admin_auth';
const AUTH_COOKIE_VALUE = 'valid_founder_session_abdullah17';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Completely disguise old /admin routes as 404 Not Found (Stealth Mode)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse('Page Not Found', { status: 404 });
  }

  // 2. Allow public auth endpoints and login page for /adminusman
  if (pathname === '/adminusman/login' || pathname.startsWith('/api/admin/auth')) {
    // If user is already authenticated and visits /adminusman/login, forward to /adminusman
    if (pathname === '/adminusman/login') {
      const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
      if (authCookie?.value === AUTH_COOKIE_VALUE) {
        return NextResponse.redirect(new URL('/adminusman', request.url));
      }
    }
    return NextResponse.next();
  }

  // 3. Check session authentication for /adminusman
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const isAuthorized = authCookie?.value === AUTH_COOKIE_VALUE;

  // 4. Protect all /adminusman pages
  if (pathname.startsWith('/adminusman')) {
    if (!isAuthorized) {
      const loginUrl = new URL('/adminusman/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Protect all internal admin APIs (/api/admin/products, /api/admin/orders, etc.)
  // Allow read-only GET on /api/admin/settings so the public /checkout page can load shipping fees & payment options
  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/settings' && request.method === 'GET') {
      return NextResponse.next();
    }
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin session required. Please authenticate at /adminusman/login.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/adminusman', '/adminusman/:path*', '/api/admin/:path*'],
};
