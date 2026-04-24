import { NextRequest } from 'next/server';

import { ensureAppSchema } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/http';
import { canManageSchedules } from '@/lib/permissions';
import { readRequestUser } from '@/lib/session';
import { recordAuditLog } from '@/services/audit.service';
import {
  cancelScheduleRecord,
  findScheduleById,
  hasScheduleConflict,
  updateScheduleRecord,
} from '@/services/schedule.service';
import { isString, isValidDate, isTimeValue } from '@/utils/validation';

export const runtime = 'nodejs';

type ScheduleUpdateBody = {
  userId?: unknown;
  teamId?: unknown;
  date?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  status?: unknown;
  title?: unknown;
  description?: unknown;
};

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureAppSchema();

    const tokenUser = readRequestUser(request);

    if (!tokenUser || !canManageSchedules(tokenUser.role)) {
      return jsonError('No autorizado.', 403);
    }

    const { id } = await context.params;
    const scheduleId = Number(id);

    if (!Number.isFinite(scheduleId)) {
      return jsonError('ID de horario inválido.', 400);
    }

    const current = await findScheduleById(scheduleId);

    if (!current) {
      return jsonError('Horario no encontrado.', 404);
    }

    const body = (await request.json().catch(() => null)) as ScheduleUpdateBody | null;
    const nextDate = body?.date === undefined ? undefined : isString(body.date) ? body.date : null;
    const nextStartTime = body?.startTime === undefined ? undefined : isString(body.startTime) ? body.startTime : null;
    const nextEndTime = body?.endTime === undefined ? undefined : isString(body.endTime) ? body.endTime : null;
    const nextTitle = body?.title === undefined ? undefined : isString(body.title) ? body.title : null;
    const nextDescription = body?.description === undefined ? undefined : isString(body.description) ? body.description : null;

    if (nextDate !== undefined && (nextDate === null || !isValidDate(nextDate))) {
      return jsonError('Fecha inválida.', 400);
    }

    if (nextStartTime !== undefined && (nextStartTime === null || !isTimeValue(nextStartTime))) {
      return jsonError('Hora de inicio inválida.', 400);
    }

    if (nextEndTime !== undefined && (nextEndTime === null || !isTimeValue(nextEndTime))) {
      return jsonError('Hora de fin inválida.', 400);
    }

    if (nextStartTime && nextEndTime && nextStartTime >= nextEndTime) {
      return jsonError('La hora de inicio debe ser menor que la hora de fin.', 400);
    }

    const conflict = await hasScheduleConflict({
      id: scheduleId,
      userId: typeof body?.userId === 'number' ? body.userId : current.userId,
      teamId: typeof body?.teamId === 'number' ? body.teamId : current.teamId,
      date: nextDate ?? current.date,
      startTime: nextStartTime ?? current.startTime,
      endTime: nextEndTime ?? current.endTime,
    });

    if (conflict) {
      return jsonError('Existe un conflicto de horario para ese rango.', 409);
    }

    const updated = await updateScheduleRecord(scheduleId, {
      userId: typeof body?.userId === 'number' ? body.userId : undefined,
      teamId: typeof body?.teamId === 'number' ? body.teamId : undefined,
      date: nextDate === undefined ? undefined : nextDate,
      startTime: nextStartTime === undefined ? undefined : nextStartTime,
      endTime: nextEndTime === undefined ? undefined : nextEndTime,
      status: body?.status === 'CANCELLED' || body?.status === 'ACTIVE' ? body.status : undefined,
      title: nextTitle === undefined ? undefined : nextTitle,
      description: nextDescription === undefined ? undefined : nextDescription,
    });

    if (!updated) {
      return jsonError('Horario no encontrado.', 404);
    }

    await recordAuditLog({
      userId: tokenUser.id,
      action: 'UPDATE',
      entity: 'schedule',
      entityId: scheduleId,
      oldData: current,
      newData: updated,
    });

    return jsonSuccess({ schedule: updated }, 'Horario actualizado.');
  } catch (error: unknown) {
    console.error('Error en /api/schedules/[id] PATCH:', error);
    return jsonError('No fue posible actualizar el horario.', 500);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureAppSchema();

    const tokenUser = readRequestUser(request);

    if (!tokenUser || !canManageSchedules(tokenUser.role)) {
      return jsonError('No autorizado.', 403);
    }

    const { id } = await context.params;
    const scheduleId = Number(id);

    if (!Number.isFinite(scheduleId)) {
      return jsonError('ID de horario inválido.', 400);
    }

    const current = await findScheduleById(scheduleId);

    if (!current) {
      return jsonError('Horario no encontrado.', 404);
    }

    const cancelled = await cancelScheduleRecord(scheduleId);

    if (!cancelled) {
      return jsonError('No fue posible cancelar el horario.', 500);
    }

    await recordAuditLog({
      userId: tokenUser.id,
      action: 'DELETE',
      entity: 'schedule',
      entityId: scheduleId,
      oldData: current,
      newData: cancelled,
    });

    return jsonSuccess({ schedule: cancelled }, 'Horario cancelado.');
  } catch (error: unknown) {
    console.error('Error en /api/schedules/[id] DELETE:', error);
    return jsonError('No fue posible cancelar el horario.', 500);
  }
}
