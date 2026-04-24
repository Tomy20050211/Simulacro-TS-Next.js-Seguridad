'use client';

import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

type AuditLogItem = {
  id: number;
  user_id: number | null;
  action: string;
  entity: string | null;
  entity_id: number | null;
  created_at: string | null;
};

export default function AuditPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/audit-logs?limit=50', { cache: 'no-store' });
      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; data?: { auditLogs?: AuditLogItem[] }; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? 'No fue posible cargar la auditoría.');
      }

      setItems(payload?.data?.auditLogs ?? []);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar la auditoría.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAuditLogs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAuditLogs]);

  return (
    <main className="min-h-[calc(100vh-72px)] px-4 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/45">Trazabilidad</p>
              <h1 className="mt-2 text-3xl font-semibold">Auditoría</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
                Vista para Admin y Manager. Consume el log de login/logout y cambios de entidades desde
                `/api/audit-logs`.
              </p>
            </div>
            <Button variant="secondary" onClick={() => void loadAuditLogs()}>
              Refrescar
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/65">
              Sesión: <span className="font-medium text-white">{user?.role ?? 'sin sesión'}</span>
            </p>
            <Badge tone="info">{items.length} eventos</Badge>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-white/60">Cargando auditoría...</p>
          ) : error ? (
            <p className="mt-4 text-sm text-red-300">{error}</p>
          ) : items.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">Todavía no hay eventos para mostrar.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div>
                    <p className="font-medium text-white">{item.action}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {item.entity ?? 'sin entidad'} #{item.entity_id ?? '-'} · usuario {item.user_id ?? '-'}
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : 'sin fecha'}
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
