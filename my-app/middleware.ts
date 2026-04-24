import { NextRequest, NextResponse } from 'next/server';

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/constants';
import { decodeTokenForMiddleware } from '@/lib/session';

const protectedPaths = ['/dashboard', '/users', '/schedules', '/audit'];
const authPaths = ['/login', '/register'];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAuthPath(pathname: string): boolean {
  return authPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function getRedirectPathForRole(roleName: string | undefined): string {
  const role = roleName?.toUpperCase();

  if (role === 'ADMIN') {
    return '/dashboard/admin';
  }

  if (role === 'MANAGER') {
    return '/dashboard/manager';
  }

  return '/dashboard/employee';
}

function isTokenExpired(token: string | undefined): boolean {
  if (!token) {
    return true;
  }

  const payload = decodeTokenForMiddleware(token);

  if (!payload?.exp) {
    return true;
  }

  return Date.now() >= payload.exp * 1000;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const hasValidAccessToken = accessToken && !isTokenExpired(accessToken);
  const hasRefreshToken = Boolean(refreshToken) && !isTokenExpired(refreshToken);

  if (isAuthPath(pathname)) {
    if (hasValidAccessToken) {
      const payload = decodeTokenForMiddleware(accessToken ?? '');
      const response = NextResponse.redirect(new URL(getRedirectPathForRole(payload?.roleName), request.url));
      return response;
    }

    if (!hasValidAccessToken && hasRefreshToken) {
      const refreshPayload = decodeTokenForMiddleware(refreshToken ?? '');
      const nextPath = getRedirectPathForRole(refreshPayload?.roleName);
      return NextResponse.redirect(new URL(`/api/auth/refresh?next=${encodeURIComponent(nextPath)}`, request.url));
    }

    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    if (hasValidAccessToken) {
      return NextResponse.next();
    }

    if (hasRefreshToken) {
      return NextResponse.redirect(new URL(`/api/auth/refresh?next=${encodeURIComponent(pathname + search)}`, request.url));
    }

    return NextResponse.redirect(new URL('/login?reason=session-expired', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/users/:path*', '/schedules/:path*', '/audit/:path*', '/login', '/register'],
};
