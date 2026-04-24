'use client';

import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import type { Role, UserStatus } from '@/types/domain';

type UserListItem = {
  id: number;
  email: string;
  status: UserStatus;
  role: Role;
  role_name: string;
};

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', { cache: 'no-store' });
      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; data?: { users?: UserListItem[] }; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? 'No fue posible cargar los usuarios.');
      }

      setUsers(payload?.data?.users ?? []);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  return (
    <main className="min-h-[calc(100vh-72px)] px-4 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/45">RBAC</p>
              <h1 className="mt-2 text-3xl font-semibold">Gestión de usuarios</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
                Esta vista está disponible solo para Admin. Desde aquí se consume el CRUD de usuarios con estados y
                roles asignables.
              </p>
            </div>
            <Button variant="secondary" onClick={() => void loadUsers()}>
              Refrescar
            </Button>
          </div>
        </Card>

        <Card>
          {user?.role !== 'ADMIN' ? (
            <p className="text-sm text-white/70">No tienes permisos para ver esta sección.</p>
          ) : loading ? (
            <p className="text-sm text-white/60">Cargando usuarios...</p>
          ) : error ? (
            <p className="text-sm text-red-300">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-white/60">Todavía no hay usuarios para mostrar.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {users.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{item.email}</h2>
                      <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/45">ID {item.id}</p>
                    </div>
                    <Badge tone={item.status === 'ACTIVE' ? 'success' : item.status === 'SUSPENDED' ? 'danger' : 'warning'}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm text-white/70">
                    Rol: <span className="font-medium text-white">{item.role_name}</span>
                  </p>
                </article>
              ))}
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
