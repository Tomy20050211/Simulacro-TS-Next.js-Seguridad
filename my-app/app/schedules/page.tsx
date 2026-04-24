'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useSchedules } from '@/context/ScheduleContext';

export default function SchedulesPage() {
  const { user } = useAuth();
  const { schedules, loading, error, refreshSchedules } = useSchedules();

  return (
    <main className="min-h-[calc(100vh-72px)] px-4 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/45">Horarios</p>
              <h1 className="mt-2 text-3xl font-semibold">Gestión de horarios</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
                Admin ve todo, Manager ve su equipo y Employee solo sus horarios. El CRUD y la validación de
                conflictos viven en `/api/schedules`.
              </p>
            </div>
            <Button variant="secondary" onClick={() => void refreshSchedules()}>
              Refrescar
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/65">
              Sesión: <span className="font-medium text-white">{user?.role ?? 'sin sesión'}</span>
            </p>
            <Badge tone="info">{schedules.length} horarios</Badge>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-white/60">Cargando horarios...</p>
          ) : error ? (
            <p className="mt-4 text-sm text-red-300">{error}</p>
          ) : schedules.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">Todavía no hay horarios para mostrar.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {schedules.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{item.title ?? 'Horario sin título'}</h2>
                      <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/45">ID {item.id}</p>
                    </div>
                    <Badge tone={item.status === 'ACTIVE' ? 'success' : 'danger'}>{item.status}</Badge>
                  </div>
                  <p className="mt-4 text-sm text-white/70">
                    {item.date} · {item.startTime} - {item.endTime}
                  </p>
                  <p className="mt-2 text-xs text-white/50">
                    Usuario: {item.userId ?? 'sin asignar'} · Equipo: {item.teamId ?? 'sin equipo'}
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
