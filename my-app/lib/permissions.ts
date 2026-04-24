import type { Role } from '@/types/domain';

export type Scope = 'own' | 'team' | 'all';

export function normalizeRole(role: string): Role {
  const upper = role.trim().toUpperCase();

  if (upper === 'ADMIN' || upper === 'MANAGER' || upper === 'EMPLOYEE') {
    return upper;
  }

  return 'EMPLOYEE';
}

export function canManageUsers(role: Role): boolean {
  return role === 'ADMIN';
}

export function canViewAudit(role: Role): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function canManageSchedules(role: Role): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function getScheduleScope(role: Role): Scope {
  if (role === 'ADMIN') {
    return 'all';
  }

  if (role === 'MANAGER') {
    return 'team';
  }

  return 'own';
}
