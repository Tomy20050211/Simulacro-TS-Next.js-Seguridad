import { NextRequest } from 'next/server';

import { ensureAppSchema } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/http';
import { clearRefreshToken, findUserById } from '@/services/auth.service';
import { clearAuthCookies, readRequestUser } from '@/lib/session';
import { recordAuditLog } from '@/services/audit.service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await ensureAppSchema();

    const tokenUser = readRequestUser(request);

    if (tokenUser) {
      const dbUser = await findUserById(tokenUser.id);

      if (dbUser) {
        await clearRefreshToken(tokenUser.id);

        await recordAuditLog({
          userId: tokenUser.id,
          action: 'LOGOUT',
          entity: 'auth',
          entityId: tokenUser.id,
          newData: { email: dbUser.email },
        });
      }
    }

    const response = jsonSuccess({ loggedOut: true }, 'Sesión cerrada.');
    clearAuthCookies(response);
    return response;
  } catch (error: unknown) {
    console.error('Error en /api/auth/logout:', error);
    return jsonError('No fue posible cerrar la sesión.', 500);
  }
}
