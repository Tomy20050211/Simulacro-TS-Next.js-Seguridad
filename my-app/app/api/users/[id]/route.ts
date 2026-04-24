import { NextRequest } from 'next/server';

import { ensureAppSchema } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/http';
import { canManageUsers } from '@/lib/permissions';
import { readRequestUser } from '@/lib/session';
import { findUserById, updateUserRecord } from '@/services/auth.service';
import { recordAuditLog } from '@/services/audit.service';
import { hashPassword } from '@/lib/password';
import { isString, isValidEmail, normalizeEmail, EMAIL_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/utils/validation';
import type { Role, UserStatus } from '@/types/domain';

export const runtime = 'nodejs';

type UpdateBody = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
  status?: unknown;
};

function isRole(value: unknown): value is Role {
  return value === 'ADMIN' || value === 'MANAGER' || value === 'EMPLOYEE';
}

function isUserStatus(value: unknown): value is UserStatus {
  return value === 'ACTIVE' || value === 'INACTIVE' || value === 'SUSPENDED';
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureAppSchema();

    const tokenUser = readRequestUser(request);

    if (!tokenUser || !canManageUsers(tokenUser.role)) {
      return jsonError('No autorizado.', 403);
    }

    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isFinite(userId)) {
      return jsonError('ID de usuario inválido.', 400);
    }

    const currentUser = await findUserById(userId);

    if (!currentUser) {
      return jsonError('Usuario no encontrado.', 404);
    }

    const body = (await request.json().catch(() => null)) as UpdateBody | null;

    const nextEmail = body?.email === undefined ? undefined : isString(body.email) ? normalizeEmail(body.email) : null;
    const nextPassword = body?.password === undefined ? undefined : isString(body.password) ? body.password.trim() : null;
    const nextRole = body?.role === undefined ? undefined : body.role;
    const nextStatus = body?.status === undefined ? undefined : body.status;

    if (nextEmail !== undefined && (nextEmail === null || nextEmail.length > EMAIL_MAX_LENGTH || !isValidEmail(nextEmail))) {
      return jsonError('Ingresa un correo electrónico válido.', 400);
    }

    if (nextPassword !== undefined && (nextPassword === null || nextPassword.length < PASSWORD_MIN_LENGTH)) {
      return jsonError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`, 400);
    }

    if (nextRole !== undefined && !isRole(nextRole)) {
      return jsonError('Rol inválido.', 400);
    }

    if (nextStatus !== undefined && !isUserStatus(nextStatus)) {
      return jsonError('Estado inválido.', 400);
    }

    const passwordHash = nextPassword ? await hashPassword(nextPassword) : null;

    const updatedUser = await updateUserRecord(userId, {
      email: nextEmail === undefined ? undefined : nextEmail,
      passwordHash,
      role: nextRole as Role | undefined,
      status: nextStatus as UserStatus | undefined,
    });

    if (!updatedUser) {
      return jsonError('Usuario no encontrado.', 404);
    }

    await recordAuditLog({
      userId: tokenUser.id,
      action: updatedUser.role !== currentUser.role_name ? 'ROLE_CHANGE' : 'UPDATE',
      entity: 'user',
      entityId: userId,
      oldData: { email: currentUser.email, role: currentUser.role_name, status: currentUser.status },
      newData: { email: updatedUser.email, role: updatedUser.role, status: updatedUser.status },
    });

    return jsonSuccess({ user: updatedUser }, 'Usuario actualizado.');
  } catch (error: unknown) {
    console.error('Error en /api/users/[id] PATCH:', error);
    return jsonError('No fue posible actualizar el usuario.', 500);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureAppSchema();

    const tokenUser = readRequestUser(request);

    if (!tokenUser || !canManageUsers(tokenUser.role)) {
      return jsonError('No autorizado.', 403);
    }

    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isFinite(userId)) {
      return jsonError('ID de usuario inválido.', 400);
    }

    const currentUser = await findUserById(userId);

    if (!currentUser) {
      return jsonError('Usuario no encontrado.', 404);
    }

    const updatedUser = await updateUserRecord(userId, { status: 'INACTIVE' });

    await recordAuditLog({
      userId: tokenUser.id,
      action: 'DELETE',
      entity: 'user',
      entityId: userId,
      oldData: { email: currentUser.email, role: currentUser.role_name, status: currentUser.status },
      newData: { email: updatedUser?.email, role: updatedUser?.role, status: 'INACTIVE' },
    });

    return jsonSuccess({ user: updatedUser }, 'Usuario desactivado.');
  } catch (error: unknown) {
    console.error('Error en /api/users/[id] DELETE:', error);
    return jsonError('No fue posible desactivar el usuario.', 500);
  }
}
