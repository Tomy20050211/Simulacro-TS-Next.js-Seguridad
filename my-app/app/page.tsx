import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const highlights = [
  'JWT + refresh tokens en cookies HttpOnly',
  'RBAC para Admin, Manager y Employee',
  'CRUD de horarios y usuarios con auditoría',
];

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-72px)] px-4 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <Badge tone="info">ClockHub</Badge>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight md:text-6xl">
                Seguridad, horarios y trazabilidad en una sola base de trabajo.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                Next.js, PostgreSQL y TypeScript strict, con autenticación completa, control de acceso por rol y
                auditoría automática para cada cambio importante.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
                >
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
              <h2 className="text-sm uppercase tracking-[0.35em] text-white/45">Incluye</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/70">
                {highlights.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <h3 className="text-lg font-semibold">Auth segura</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Registro, login, refresh y logout con cookies HttpOnly y redirección automática al expirar sesión.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">RBAC real</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Admin, Manager y Employee con permisos distintos para usuarios, horarios y auditoría.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">Auditoría</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Cada login, logout y cambio de entidad queda registrado para trazabilidad completa.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
