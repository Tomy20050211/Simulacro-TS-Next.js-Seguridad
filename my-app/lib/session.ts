import { NextResponse, type NextRequest } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@/lib/constants';
import { decodeTokenPayload, signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import type { AuthUser } from '@/types/domain';

const cookieBaseOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function createAuthTokens(user: AuthUser) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return { accessToken, refreshToken };
}

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: accessToken,
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    ...cookieBaseOptions,
  });

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: refreshToken,
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
    ...cookieBaseOptions,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: '',
    maxAge: 0,
    ...cookieBaseOptions,
  });

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: '',
    maxAge: 0,
    ...cookieBaseOptions,
  });
}

export function getAuthTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export function getRefreshTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

export function readRequestUser(request: NextRequest): AuthUser | null {
  const token = getAuthTokenFromRequest(request);

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);

    return {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
      roleName: payload.roleName,
      status: payload.status,
    };
  } catch {
    return null;
  }
}

export function canRefresh(request: NextRequest): boolean {
  const refreshToken = getRefreshTokenFromRequest(request);

  if (!refreshToken) {
    return false;
  }

  try {
    verifyRefreshToken(refreshToken);
    return true;
  } catch {
    return false;
  }
}

export function decodeTokenForMiddleware(token: string) {
  return decodeTokenPayload(token);
}

