import pool from '@/lib/db';
import type { AuditAction } from '@/types/domain';

type AuditInput = {
  userId?: number | null;
  action: AuditAction | string;
  entity?: string | null;
  entityId?: number | null;
  oldData?: unknown;
  newData?: unknown;
};

export async function recordAuditLog(input: AuditInput): Promise<void> {
  await pool.query(
    `
      INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data, created_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, now())
    `,
    [
      input.userId ?? null,
      input.action,
      input.entity ?? null,
      input.entityId ?? null,
      input.oldData ? JSON.stringify(input.oldData) : null,
      input.newData ? JSON.stringify(input.newData) : null,
    ],
  );
}

