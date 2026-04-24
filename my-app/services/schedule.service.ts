import pool from '@/lib/db';
import type { ScheduleRecord, ScheduleStatus } from '@/types/domain';

type ScheduleRow = {
  id: number;
  user_id: number | null;
  team_id: number | null;
  date: Date | string;
  start_time: string;
  end_time: string;
  status: ScheduleStatus;
  created_by: number | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  title: string | null;
  description: string | null;
};

function toScheduleRecord(row: ScheduleRow): ScheduleRecord {
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date),
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    title: row.title,
    description: row.description,
  };
}

export async function listSchedules(query: {
  scope: 'all' | 'team' | 'own';
  userId: number;
  teamIds?: number[];
}): Promise<ScheduleRecord[]> {
  const params: Array<number | number[]> = [query.userId];
  const conditions: string[] = ["COALESCE(s.status, 'ACTIVE') <> 'CANCELLED'"];

  if (query.scope === 'own') {
    conditions.push('s.user_id = $1');
  } else if (query.scope === 'team') {
    if (query.teamIds && query.teamIds.length > 0) {
      params.push(query.teamIds);
      conditions.push(`(s.team_id = ANY($2::int[]) OR s.user_id = $1)`);
    } else {
      conditions.push('s.user_id = $1');
    }
  }

  const result = await pool.query<ScheduleRow>(
    `
      SELECT
        s.id,
        s.user_id,
        s.team_id,
        s.date,
        s.start_time,
        s.end_time,
        COALESCE(s.status, 'ACTIVE') AS status,
        s.created_by,
        s.created_at,
        s.updated_at,
        s.title,
        s.description
      FROM public.schedules s
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.date DESC, s.start_time ASC
    `,
    params,
  );

  return result.rows.map(toScheduleRecord);
}

export async function findScheduleById(id: number): Promise<ScheduleRecord | null> {
  const result = await pool.query<ScheduleRow>(
    `
      SELECT
        s.id,
        s.user_id,
        s.team_id,
        s.date,
        s.start_time,
        s.end_time,
        COALESCE(s.status, 'ACTIVE') AS status,
        s.created_by,
        s.created_at,
        s.updated_at,
        s.title,
        s.description
      FROM public.schedules s
      WHERE s.id = $1
      LIMIT 1
    `,
    [id],
  );

  const row = result.rows[0];

  return row ? toScheduleRecord(row) : null;
}

export async function hasScheduleConflict(input: {
  id?: number;
  userId?: number | null;
  teamId?: number | null;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<boolean> {
  const params = [input.date, input.startTime, input.endTime, input.userId ?? null, input.teamId ?? null, input.id ?? null];

  const result = await pool.query<{ conflict: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM public.schedules s
        WHERE COALESCE(s.status, 'ACTIVE') <> 'CANCELLED'
          AND s.date = $1::date
          AND s.start_time < $3::time
          AND s.end_time > $2::time
          AND ($4::int IS NULL OR s.user_id = $4::int)
          AND ($5::int IS NULL OR s.team_id = $5::int)
          AND ($6::int IS NULL OR s.id <> $6::int)
      ) AS conflict
    `,
    params,
  );

  return Boolean(result.rows[0]?.conflict);
}

export async function createScheduleRecord(input: {
  userId: number | null;
  teamId: number | null;
  date: string;
  startTime: string;
  endTime: string;
  title?: string | null;
  description?: string | null;
  createdBy: number;
}): Promise<ScheduleRecord> {
  const result = await pool.query<ScheduleRow>(
    `
      INSERT INTO public.schedules (user_id, team_id, date, start_time, end_time, title, description, status, created_by, updated_at)
      VALUES ($1, $2, $3::date, $4::time, $5::time, $6, $7, 'ACTIVE', $8, now())
      RETURNING id, user_id, team_id, date, start_time, end_time, status, created_by, created_at, updated_at, title, description
    `,
    [input.userId, input.teamId, input.date, input.startTime, input.endTime, input.title ?? null, input.description ?? null, input.createdBy],
  );

  return toScheduleRecord(result.rows[0]);
}

export async function updateScheduleRecord(
  id: number,
  input: {
    userId?: number | null;
    teamId?: number | null;
    date?: string;
    startTime?: string;
    endTime?: string;
    status?: ScheduleStatus;
    title?: string | null;
    description?: string | null;
  },
): Promise<ScheduleRecord | null> {
  const current = await findScheduleById(id);

  if (!current) {
    return null;
  }

  const result = await pool.query<ScheduleRow>(
    `
      UPDATE public.schedules
      SET
        user_id = COALESCE($1, user_id),
        team_id = COALESCE($2, team_id),
        date = COALESCE($3::date, date),
        start_time = COALESCE($4::time, start_time),
        end_time = COALESCE($5::time, end_time),
        status = COALESCE($6, status),
        title = COALESCE($7, title),
        description = COALESCE($8, description),
        updated_at = now()
      WHERE id = $9
      RETURNING id, user_id, team_id, date, start_time, end_time, status, created_by, created_at, updated_at, title, description
    `,
    [
      input.userId ?? null,
      input.teamId ?? null,
      input.date ?? null,
      input.startTime ?? null,
      input.endTime ?? null,
      input.status ?? null,
      input.title ?? null,
      input.description ?? null,
      id,
    ],
  );

  return toScheduleRecord(result.rows[0]);
}

export async function cancelScheduleRecord(id: number): Promise<ScheduleRecord | null> {
  return updateScheduleRecord(id, { status: 'CANCELLED' });
}

