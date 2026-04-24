import { NextRequest } from 'next/server';

import pool, { ensureAppSchema } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/http';
import { canManageSchedules, getScheduleScope } from '@/lib/permissions';
import { readRequestUser } from '@/lib/session';
import { recordAuditLog } from '@/services/audit.service';
import { createScheduleRecord, hasScheduleConflict, listSchedules } from '@/services/schedule.service';
import { isValidDate, isString, isTimeValue } from '@/utils/validation';

export const runtime = 'nodejs';

type ScheduleBody = {
  userId?: unknown;
  teamId?: unknown;
  date?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  title?: unknown;
  description?: unknown;
};

async function getManagerTeamIds(userId: number): Promise<number[]> {
  const result = await pool.query<{ team_id: number | null }>('SELECT team_id FROM public.team_members WHERE user_id = $1', [userId]);
  return result.rows.map((row) => row.team_id).filter((teamId): teamId is number => typeof teamId === 'number');
}

export async function GET(request: NextRequest) {
  try {
    await ensureAppSchema();

    const tokenUser = readRequestUser(request);

    if (!tokenUser) {
      return jsonError('No autenticado.', 401);
    }

    const scope = getScheduleScope(tokenUser.role);
    const teamIds = scope === 'team' ? await getManagerTeamIds(tokenUser.id) : undefined;
    const schedules = await listSchedules({ scope, userId: tokenUser.id, teamIds });

    return jsonSuccess({ schedules }, 'Horarios cargados.');
  } catch (error: unknown) {
    console.error('Error en /api/schedules GET:', error);
    return jsonError('No fue posible cargar los horarios.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAppSchema();

    const tokenUser = readRequestUser(request);

    if (!tokenUser || !canManageSchedules(tokenUser.role)) {
      return jsonError('No autorizado.', 403);
    }

    const body = (await request.json().catch(() => null)) as ScheduleBody | null;

    if (!body || !isString(body.date) || !isString(body.startTime) || !isString(body.endTime)) {
      return jsonError('Datos inválidos para crear el horario.', 400);
    }

    if (!isValidDate(body.date) || !isTimeValue(body.startTime) || !isTimeValue(body.endTime)) {
      return jsonError('Fecha u hora inválida.', 400);
    }

    if (body.startTime >= body.endTime) {
      return jsonError('La hora de inicio debe ser menor que la hora de fin.', 400);
    }

    const userId = typeof body.userId === 'number' ? body.userId : null;
    const teamId = typeof body.teamId === 'number' ? body.teamId : null;

    const conflict = await hasScheduleConflict({
      userId,
      teamId,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    if (conflict) {
      return jsonError('Existe un conflicto de horario para ese rango.', 409);
    }

    const schedule = await createScheduleRecord({
      userId,
      teamId,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      title: isString(body.title) ? body.title : null,
      description: isString(body.description) ? body.description : null,
      createdBy: tokenUser.id,
    });

    await recordAuditLog({
      userId: tokenUser.id,
      action: 'CREATE',
      entity: 'schedule',
      entityId: schedule.id,
      newData: schedule,
    });

    return jsonSuccess({ schedule }, 'Horario creado.', 201);
  } catch (error: unknown) {
    console.error('Error en /api/schedules POST:', error);
    return jsonError('No fue posible crear el horario.', 500);
  }
}
