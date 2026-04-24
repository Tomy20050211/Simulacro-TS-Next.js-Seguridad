import 'server-only';

import { Pool } from 'pg';

type GlobalDatabase = {
  pool?: Pool;
  schemaReady?: Promise<void>;
};

const globalForDatabase = globalThis as unknown as GlobalDatabase;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en el entorno.');
}

const connectionUrl = new URL(connectionString);
const shouldUseSsl =
  connectionUrl.hostname.includes('supabase') ||
  connectionUrl.hostname.includes('pooler') ||
  connectionUrl.searchParams.get('sslmode') === 'require';

const poolConfig: ConstructorParameters<typeof Pool>[0] = {
  connectionString,
  ...(shouldUseSsl
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {}),
};

const pool = globalForDatabase.pool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForDatabase.pool = pool;
}

async function seedRoles(): Promise<void> {
  await pool.query(`
    INSERT INTO public.roles (name)
    VALUES ('ADMIN'), ('MANAGER'), ('EMPLOYEE')
    ON CONFLICT (name) DO NOTHING
  `);
}

async function ensureSchema(): Promise<void> {
  await pool.query(`
    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS refresh_token_hash text,
      ADD COLUMN IF NOT EXISTS refresh_token_expires_at timestamptz,
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()
  `);

  await pool.query(`
    ALTER TABLE public.schedules
      ADD COLUMN IF NOT EXISTS team_id integer,
      ADD COLUMN IF NOT EXISTS title varchar(160),
      ADD COLUMN IF NOT EXISTS description text,
      ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()
  `);

  await pool.query(`
    ALTER TABLE public.audit_logs
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_schedules_user_date ON public.schedules (user_id, date);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_schedules_team_date ON public.schedules (team_id, date);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
  `);

  await seedRoles();
}

export async function ensureAppSchema(): Promise<void> {
  if (!globalForDatabase.schemaReady) {
    globalForDatabase.schemaReady = ensureSchema().catch((error: unknown) => {
      globalForDatabase.schemaReady = undefined;
      throw error;
    });
  }

  return globalForDatabase.schemaReady;
}

export default pool;
