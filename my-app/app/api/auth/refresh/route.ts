import { NextRequest, NextResponse } from 'next/server';

import { REFRESH_TOKEN_COOKIE } from '@/lib/constants';
import { ensureAppSchema } from '@/lib/db';
import { jsonError } from '@/lib/http';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/jwt';
import { clearAuthCookies, setAuthCookies } from '@/lib/session';
import { findUserById, resolveAuthUser, updateRefreshToken } from '@/services/auth.service';
import { comparePassword, hashPassword } from '@/lib/password';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await ensureAppSchema();

    const nextPath = request.nextUrl.searchParams.get('next') || '/dashboard/employee';
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshToken) {
      return NextResponse.redirect(new URL('/login?reason=session-expired', request.url));
    }

    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      const response = NextResponse.redirect(new URL('/login?reason=session-expired', request.url));
      clearAuthCookies(response);
      return response;
    }

    const userId = Number(payload.sub);
    const dbUser = await findUserById(userId);

    if (!dbUser) {
      const response = NextResponse.redirect(new URL('/login?reason=session-expired', request.url));
      clearAuthCookies(response);
      return response;
    }

    const authUser = await resolveAuthUser({
      id: dbUser.id,
      email: dbUser.email,
      status: dbUser.status ?? 'ACTIVE',
      role_name: dbUser.role_name,
    });

    if (authUser.status !== 'ACTIVE') {
      const response = NextResponse.redirect(new URL('/login?reason=inactive-account', request.url));
      clearAuthCookies(response);
      return response;
    }

    const refreshMatches = await comparePassword(refreshToken, dbUser.refresh_token_hash ?? '').catch(() => false);

    if (!refreshMatches) {
      const response = NextResponse.redirect(new URL('/login?reason=session-expired', request.url));
      clearAuthCookies(response);
      return response;
    }

    const nextAccessToken = signAccessToken(authUser);
    const nextRefreshToken = signRefreshToken(authUser);
    const response = NextResponse.redirect(new URL(nextPath, request.url));

    setAuthCookies(response, nextAccessToken, nextRefreshToken);
    await updateRefreshToken(
      authUser.id,
      await hashPassword(nextRefreshToken),
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    );

    return response;
  } catch (error: unknown) {
    console.error('Error en /api/auth/refresh:', error);
    return jsonError('No fue posible renovar la sesión.', 500);
  }
}
