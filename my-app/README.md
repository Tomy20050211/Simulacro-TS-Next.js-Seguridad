# ClockHub

Aplicación Next.js con autenticación segura, RBAC, CRUD de horarios, usuarios y auditoría.

## Stack

- Next.js 16, React 19, TypeScript strict
- PostgreSQL
- `bcryptjs` para hashing de contraseñas
- `jsonwebtoken` para access tokens y refresh tokens
- Cookies HttpOnly para la sesión
- Tailwind CSS

## Variables de entorno

Configura al menos:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/clockhub
JWT_SECRET=una_clave_larga_y_segura
REFRESH_TOKEN_SECRET=otra_clave_larga_y_segura
```

## Flujo de autenticación

1. `POST /api/auth/register` registra usuarios con validación y bcryptjs.
2. `POST /api/auth/login` genera access token y refresh token.
3. `GET /api/auth/me` valida la sesión activa.
4. `GET /api/auth/refresh` rota tokens cuando el access token expira.
5. `POST /api/auth/logout` cierra la sesión y limpia cookies.

## API REST

- `/api/auth/*`
- `/api/users`
- `/api/users/[id]`
- `/api/schedules`
- `/api/schedules/[id]`
- `/api/audit-logs`

## RBAC

- `ADMIN`: acceso total
- `MANAGER`: horarios de su equipo y auditoría limitada
- `EMPLOYEE`: solo sus horarios

## UI principal

- `/login`
- `/register`
- `/dashboard/[role]`
- `/users`
- `/schedules`
- `/audit`

## Notas

- El middleware protege rutas privadas y redirige automáticamente si la sesión expiró.
- El esquema de base de datos se completa con columnas faltantes mediante `ALTER TABLE IF NOT EXISTS`.
- La auditoría registra login, logout, cambios de rol y CRUD de usuarios/horarios.
