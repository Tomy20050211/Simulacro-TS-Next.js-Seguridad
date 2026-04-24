import { NextRequest } from 'next/server';

import { ensureAppSchema } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/http';
import { readRequestUser } from '@/lib/session';
import { findUserById, resolveAuthUser } from '@/services/auth.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await ensureAppSchema();

    const tokenUser = readRequestUser(request);

    if (!tokenUser) {
      return jsonError('No autenticado.', 401);
    }

    const dbUser = await findUserById(tokenUser.id);

    if (!dbUser) {
      return jsonError('No autenticado.', 401);
    }

    const authUser = await resolveAuthUser({
      id: dbUser.id,
      email: dbUser.email,
      status: dbUser.status ?? 'ACTIVE',
      role_name: dbUser.role_name,
    });

    return jsonSuccess({ user: authUser }, 'Sesión activa.');
  } catch (error: unknown) {
    console.error('Error en /api/auth/me:', error);
    return jsonError('No fue posible verificar la sesión.', 500);
  }
}
