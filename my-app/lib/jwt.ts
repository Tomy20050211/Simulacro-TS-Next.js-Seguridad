import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  TOKEN_AUDIENCE,
  TOKEN_ISSUER,
} from '@/lib/constants';
import type { AuthUser, Role, UserStatus } from '@/types/domain';

type TokenKind = 'access' | 'refresh';

export type AuthTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  role: Role;
  roleName: string;
  status: UserStatus;
  tokenType: TokenKind;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET no está definida en el entorno.');
  }

  return secret;
}

function getRefreshSecret(): string {
  return process.env.REFRESH_TOKEN_SECRET || getSecret();
}

function signToken(
  payload: Omit<AuthTokenPayload, keyof JwtPayload | 'exp' | 'iat'>,
  tokenKind: TokenKind,
): string {
  const secret = tokenKind === 'access' ? getSecret() : getRefreshSecret();
  const options: SignOptions = {
    algorithm: 'HS256',
    audience: TOKEN_AUDIENCE,
    issuer: TOKEN_ISSUER,
    expiresIn: tokenKind === 'access' ? ACCESS_TOKEN_TTL_SECONDS : REFRESH_TOKEN_TTL_SECONDS,
  };

  return jwt.sign(payload, secret, options);
}

export function signAccessToken(user: AuthUser): string {
  return signToken(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
      roleName: user.roleName,
      status: user.status,
      tokenType: 'access',
    },
    'access',
  );
}

export function signRefreshToken(user: AuthUser): string {
  return signToken(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
      roleName: user.roleName,
      status: user.status,
      tokenType: 'refresh',
    },
    'refresh',
  );
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getSecret(), {
    algorithms: ['HS256'],
    audience: TOKEN_AUDIENCE,
    issuer: TOKEN_ISSUER,
  }) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getRefreshSecret(), {
    algorithms: ['HS256'],
    audience: TOKEN_AUDIENCE,
    issuer: TOKEN_ISSUER,
  }) as AuthTokenPayload;
}

export function decodeTokenPayload(token: string): Partial<AuthTokenPayload> | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const raw =
      typeof globalThis.atob === 'function'
        ? globalThis.atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(raw) as Partial<AuthTokenPayload>;
  } catch {
    return null;
  }
}
