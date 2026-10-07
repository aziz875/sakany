import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The refresh token cookie name from auth-helpers
const REFRESH_TOKEN_COOKIE_NAME = 'sakany_refresh';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect landlord and profile routes
  if (pathname.startsWith('/landlord') || pathname.startsWith('/profile')) {
    const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE_NAME);

    if (!hasRefreshToken) {
      // Redirect to login if they have no session cookie at all
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware on protected routes to minimize overhead
  matcher: ['/landlord/:path*', '/profile/:path*'],
};
