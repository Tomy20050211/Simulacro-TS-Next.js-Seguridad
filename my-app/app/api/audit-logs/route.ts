import { NextRequest } from 'next/server';

import { ensureAppSchema } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/http';
import { canViewAudit } from '@/lib/permissions';
import { readRequestUser } from '@/lib/session';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await ensureAppSchema();

    const tokenUser = readRequestUser(request);

    if (!tokenUser || !canViewAudit(tokenUser.role)) {
      return jsonError('No autorizado.', 403);
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 200);

    const result = await pool.query(
      tokenUser.role === 'ADMIN'
        ? `
            SELECT id, user_id, action, entity, entity_id, old_data, new_data, created_at
            FROM public.audit_logs
            ORDER BY created_at DESC
            LIMIT $1
          `
        : `
            SELECT id, user_id, action, entity, entity_id, old_data, new_data, created_at
            FROM public.audit_logs
            WHERE entity = 'schedule' OR action IN ('LOGIN', 'LOGOUT')
            ORDER BY created_at DESC
            LIMIT $1
          `,
      [limit],
    );

    return jsonSuccess({ auditLogs: result.rows }, 'Auditoría cargada.');
  } catch (error: unknown) {
    console.error('Error en /api/audit-logs GET:', error);
    return jsonError('No fue posible cargar la auditoría.', 500);
  }
}
