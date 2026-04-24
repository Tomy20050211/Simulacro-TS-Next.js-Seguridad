import { NextRequest } from 'next/server';

import { ensureAppSchema } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/http';
import { canManageUsers } from '@/lib/permissions';
import { readRequestUser } from '@/lib/session';
import { createUserRecord, findUserByEmail, listUsers } from '@/services/auth.service';
import { recordAuditLog } from '@/services/audit.service';
import { hashPassword } from '@/lib/password';
import { isNonEmptyString, isString, isValidEmail, normalizeEmail, EMAIL_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/utils/validation';
import type { Role, UserStatus } from '@/types/domain';

export const runtime = 'nodejs';

type UsersBody = {
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

export async function GET(request: NextRequest) {
  try {
    await ensureAppSchema();

    const tokenUser = readRequestUser(request);

    if (!tokenUser || !canManageUsers(tokenUser.role)) {
      return jsonError('No autorizado.', 403);
    }

    const users = await listUsers();
    return jsonSuccess({ users }, 'Usuarios cargados.');
  } catch (error: unknown) {
    console.error('Error en /api/users GET:', error);
    return jsonError('No fue posible cargar los usuarios.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAppSchema();

    const tokenUser = readRequestUser(request);

    if (!tokenUser || !canManageUsers(tokenUser.role)) {
      return jsonError('No autorizado.', 403);
    }

    const body = (await request.json().catch(() => null)) as UsersBody | null;

    if (!body || !isString(body.email) || !isString(body.password) || !isString(body.role) || !isString(body.status)) {
      return jsonError('Datos inválidos para crear el usuario.', 400);
    }

    const email = normalizeEmail(body.email);
    const password = body.password.trim();

    if (!isNonEmptyString(email) || email.length > EMAIL_MAX_LENGTH || !isValidEmail(email)) {
      return jsonError('Ingresa un correo electrónico válido.', 400);
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return jsonError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`, 400);
    }

    if (!isRole(body.role) || !isUserStatus(body.status)) {
      return jsonError('Rol o estado inválido.', 400);
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return jsonError('Ese correo ya está registrado.', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await createUserRecord({
      email,
      passwordHash,
      role: body.role,
      status: body.status,
    });

    await recordAuditLog({
      userId: tokenUser.id,
      action: 'CREATE',
      entity: 'user',
      entityId: user.id,
      newData: { email: user.email, role: user.role, status: user.status },
    });

    return jsonSuccess({ user }, 'Usuario creado.', 201);
  } catch (error: unknown) {
    console.error('Error en /api/users POST:', error);
    return jsonError('No fue posible crear el usuario.', 500);
  }
}
