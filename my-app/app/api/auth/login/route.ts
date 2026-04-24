import { ensureAppSchema } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/http';
import { comparePassword, hashPassword } from '@/lib/password';
import { setAuthCookies } from '@/lib/session';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { findUserByEmail, resolveAuthUser, updateRefreshToken } from '@/services/auth.service';
import { recordAuditLog } from '@/services/audit.service';
import { isNonEmptyString, isString, normalizeEmail, EMAIL_MAX_LENGTH, isValidEmail } from '@/utils/validation';

export const runtime = 'nodejs';

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  try {
    await ensureAppSchema();

    const body = (await request.json().catch(() => null)) as LoginBody | null;

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

    const user = await findUserByEmail(email);

    if (!user) {
      return jsonError('El correo o la contraseña son incorrectos.', 401);
    }

    const currentStatus = (user.status ?? 'ACTIVE').toUpperCase();

    if (currentStatus !== 'ACTIVE') {
      return jsonError('Tu cuenta está inactiva o suspendida. Contacta a un administrador.', 403);
    }

    const passwordMatches = await comparePassword(password, user.password);

    if (!passwordMatches) {
      return jsonError('El correo o la contraseña son incorrectos.', 401);
    }

    const authUser = await resolveAuthUser({
      id: user.id,
      email: user.email,
      status: user.status ?? 'ACTIVE',
      role_name: user.role_name,
    });

    const accessToken = signAccessToken(authUser);
    const refreshToken = signRefreshToken(authUser);

    const refreshTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const refreshTokenHash = await hashPassword(refreshToken);
    await updateRefreshToken(user.id, refreshTokenHash, refreshTokenExpiresAt);

    const response = jsonSuccess(
      {
        user: authUser,
        dashboardPath: `/dashboard/${authUser.role.toLowerCase()}`,
      },
      'Login exitoso.',
    );

    setAuthCookies(response, accessToken, refreshToken);

    await recordAuditLog({
      userId: authUser.id,
      action: 'LOGIN',
      entity: 'auth',
      entityId: authUser.id,
      newData: { email: authUser.email, role: authUser.role, status: authUser.status },
    });

    return response;
  } catch (error: unknown) {
    console.error('Error en /api/auth/login:', error);
    return jsonError('No fue posible procesar el inicio de sesión.', 500);
  }
}
