import pool from '@/lib/db';
import { normalizeRole } from '@/lib/permissions';
import type { AuthUser, Role, UserStatus } from '@/types/domain';

type UserRow = {
  id: number;
  email: string;
  password: string;
  role_id: number | null;
  status: UserStatus | null;
  refresh_token_hash: string | null;
  refresh_token_expires_at: Date | string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
};

type PublicUserRow = {
  id: number;
  email: string;
  status: UserStatus;
  role: Role;
  role_name: string;
};

export async function getRoleId(role: Role): Promise<number> {
  const result = await pool.query<{ id: number }>('SELECT id FROM public.roles WHERE name = $1 LIMIT 1', [role]);
  const roleId = result.rows[0]?.id;

  if (!roleId) {
    throw new Error(`No existe el rol ${role}.`);
  }

  return roleId;
}

export async function getRoleNameById(roleId: number | null): Promise<string> {
  if (!roleId) {
    return 'EMPLOYEE';
  }

  const result = await pool.query<{ name: string }>('SELECT name FROM public.roles WHERE id = $1 LIMIT 1', [roleId]);
  return result.rows[0]?.name ?? 'EMPLOYEE';
}

export async function findUserByEmail(email: string): Promise<(UserRow & { role_name: string }) | null> {
  const result = await pool.query<UserRow & { role_name: string }>(
    `
      SELECT
        u.id,
        u.email,
        u.password,
        u.role_id,
        COALESCE(u.status, 'ACTIVE') AS status,
        u.refresh_token_hash,
        u.refresh_token_expires_at,
        u.created_at,
        u.updated_at,
        r.name AS role_name
      FROM public.users u
      LEFT JOIN public.roles r ON r.id = u.role_id
      WHERE u.email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id: number): Promise<(UserRow & { role_name: string }) | null> {
  const result = await pool.query<UserRow & { role_name: string }>(
    `
      SELECT
        u.id,
        u.email,
        u.password,
        u.role_id,
        COALESCE(u.status, 'ACTIVE') AS status,
        u.refresh_token_hash,
        u.refresh_token_expires_at,
        u.created_at,
        u.updated_at,
        r.name AS role_name
      FROM public.users u
      LEFT JOIN public.roles r ON r.id = u.role_id
      WHERE u.id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function listUsers(): Promise<PublicUserRow[]> {
  const result = await pool.query<PublicUserRow>(
    `
      SELECT
        u.id,
        u.email,
        COALESCE(u.status, 'ACTIVE') AS status,
        COALESCE(r.name, 'EMPLOYEE') AS role,
        COALESCE(r.name, 'EMPLOYEE') AS role_name
      FROM public.users u
      LEFT JOIN public.roles r ON r.id = u.role_id
      ORDER BY u.id DESC
    `,
  );

  return result.rows;
}

export async function createUserRecord(input: {
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
}): Promise<AuthUser> {
  const roleId = await getRoleId(input.role);

  const result = await pool.query<AuthUser>(
    `
      INSERT INTO public.users (email, password, role_id, status, updated_at)
      VALUES ($1, $2, $3, $4, now())
      RETURNING id, email, $5::text AS role, $5::text AS "roleName", status
    `,
    [input.email, input.passwordHash, roleId, input.status, input.role],
  );

  return result.rows[0];
}

export async function updateUserRecord(
  id: number,
  input: {
    email?: string;
    passwordHash?: string | null;
    role?: Role;
    status?: UserStatus;
  },
): Promise<AuthUser | null> {
  const current = await findUserById(id);

  if (!current) {
    return null;
  }

  const nextEmail = input.email ?? current.email;
  const nextRole = input.role ? input.role : normalizeRole(current.role_name ?? 'EMPLOYEE');
  const nextRoleId = await getRoleId(nextRole);
  const nextStatus = input.status ?? current.status ?? 'ACTIVE';

  const result = await pool.query<AuthUser>(
    `
      UPDATE public.users
      SET
        email = $1,
        password = COALESCE($2, password),
        role_id = $3,
        status = $4,
        updated_at = now()
      WHERE id = $5
      RETURNING id, email, $6::text AS role, $6::text AS "roleName", status
    `,
    [nextEmail, input.passwordHash ?? null, nextRoleId, nextStatus, id, nextRole],
  );

  return result.rows[0] ?? null;
}

export async function updateRefreshToken(
  userId: number,
  refreshTokenHash: string,
  refreshTokenExpiresAt: Date,
): Promise<void> {
  await pool.query(
    `
      UPDATE public.users
      SET refresh_token_hash = $1, refresh_token_expires_at = $2, updated_at = now()
      WHERE id = $3
    `,
    [refreshTokenHash, refreshTokenExpiresAt.toISOString(), userId],
  );
}

export async function clearRefreshToken(userId: number): Promise<void> {
  await pool.query(
    `
      UPDATE public.users
      SET refresh_token_hash = NULL, refresh_token_expires_at = NULL, updated_at = now()
      WHERE id = $1
    `,
    [userId],
  );
}

export async function resolveAuthUser(userRow: { id: number; email: string; status: UserStatus; role_name: string | null }): Promise<AuthUser> {
  const role = normalizeRole(userRow.role_name ?? 'EMPLOYEE');

  return {
    id: userRow.id,
    email: userRow.email,
    role,
    roleName: userRow.role_name ?? role,
    status: userRow.status,
  };
}
