export const Roles = ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const;
export type Role = (typeof Roles)[number];

export const UserStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
export type UserStatus = (typeof UserStatuses)[number];

export const ScheduleStatuses = ['ACTIVE', 'CANCELLED'] as const;
export type ScheduleStatus = (typeof ScheduleStatuses)[number];

export const AuditActions = [
  'LOGIN',
  'LOGOUT',
  'CREATE',
  'UPDATE',
  'DELETE',
  'ROLE_CHANGE',
  'PASSWORD_RESET',
] as const;

export type AuditAction = (typeof AuditActions)[number];

export type AuthUser = {
  id: number;
  email: string;
  role: Role;
  roleName: string;
  status: UserStatus;
};

export type ScheduleRecord = {
  id: number;
  userId: number | null;
  teamId: number | null;
  date: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  createdBy: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  title: string | null;
  description: string | null;
};

export type AuditLogRecord = {
  id: number;
  userId: number | null;
  action: AuditAction | string;
  entity: string | null;
  entityId: number | null;
  oldData: unknown;
  newData: unknown;
  createdAt: string | null;
};
