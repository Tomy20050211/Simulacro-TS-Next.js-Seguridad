import { jsonError, jsonSuccess } from '@/lib/http';
import { hashPassword } from '@/lib/password';
import { ensureAppSchema } from '@/lib/db';
import { createUserRecord, findUserByEmail } from '@/services/auth.service';
import { recordAuditLog } from '@/services/audit.service';
import type { Role } from '@/types/domain';
import { isNonEmptyString, isString, normalizeEmail, EMAIL_MAX_LENGTH, PASSWORD_MIN_LENGTH, isValidEmail } from '@/utils/validation';

export const runtime = 'nodejs';

type RegisterBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  try {
    await ensureAppSchema();

    const body = (await request.json().catch(() => null)) as RegisterBody | null;

    if (!body || !isString(body.email) || !isString(body.password)) {
      return jsonError('Debes enviar correo y contraseña válidos.', 400);
    }

    const email = normalizeEmail(body.email);
    const password = body.password.trim();

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return jsonError('Correo y contraseña son obligatorios.', 400);
    }

    if (email.length > EMAIL_MAX_LENGTH || !isValidEmail(email)) {
      return jsonError('Ingresa un correo electrónico válido.', 400);
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return jsonError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`, 400);
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return jsonError('Ese correo ya está registrado.', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await createUserRecord({
      email,
      passwordHash,
      role: 'EMPLOYEE' as Role,
      status: 'ACTIVE',
    });

    await recordAuditLog({
      userId: user.id,
      action: 'CREATE',
      entity: 'user',
      entityId: user.id,
      newData: { email: user.email, role: user.role, status: user.status },
    });

    return jsonSuccess(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        roleName: user.roleName,
        status: user.status,
      },
      'Usuario registrado correctamente.',
      201,
    );
  } catch (error: unknown) {
    console.error('Error en /api/auth/register:', error);
    return jsonError('No fue posible procesar el registro.', 500);
  }
}
