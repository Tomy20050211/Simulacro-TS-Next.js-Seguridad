import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type DashboardPageProps = {
  params: Promise<{
    role: string;
  }>;
};

function getDashboardTitle(role: string): string {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole === 'admin') {
    return 'Dashboard de administrador';
  }

  if (normalizedRole === 'manager') {
    return 'Dashboard de manager';
  }

  return 'Dashboard de employee';
}

function getScopeLabel(role: string): string {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole === 'admin') {
    return 'Acceso total';
  }

  if (normalizedRole === 'manager') {
    return 'Equipo y auditoría limitada';
  }

  return 'Solo horarios propios';
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { role } = await params;
  const title = getDashboardTitle(role);

  const menu = [
    { href: '/schedules', label: 'Horarios' },
    { href: '/audit', label: 'Auditoría' },
    { href: '/users', label: 'Usuarios' },
  ];

  return (
    <main className="min-h-[calc(100vh-72px)] px-4 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/45">ClockHub</p>
              <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
                Esta vista concentra RBAC, autenticación, horarios, usuarios y auditoría. Las cookies HttpOnly
                mantienen la sesión viva y el middleware protege las rutas sensibles.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Badge tone="info">{getScopeLabel(role)}</Badge>
                <Badge tone={role.toLowerCase() === 'admin' ? 'success' : 'neutral'}>{role.toUpperCase()}</Badge>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {menu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
              <h2 className="text-sm uppercase tracking-[0.35em] text-white/45">Matriz RBAC</h2>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <p>Admin: ve todo, gestiona usuarios y cambia roles.</p>
                <p>Manager: gestiona su equipo, crea horarios y ve auditoría limitada.</p>
                <p>Employee: solo consulta sus propios horarios.</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <h3 className="text-lg font-semibold">Autenticación</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Login y registro con validación, bcryptjs y tokens JWT con refresh en cookies HttpOnly.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">Horarios</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              CRUD con validación de conflictos, cancelación lógica y auditoría automática.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">Trazabilidad</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Cada login, logout, cambio de rol o CRUD deja un rastro consultable por Admin y Manager.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
