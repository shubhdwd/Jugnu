# Jugnu Backend — Deployment Guide

Production deployment runbook for the Jugnu backend (Express + TypeScript + Prisma + PostgreSQL).

## Deploy mechanism

One-click deploy targets (all build from `backend/Dockerfile`):

- **Render** (recommended start): new Web Service → source repo / `backend`, runtime Docker, env below.
- **Railway**: new Service → repo, deploy root `backend`, Dockerfile.
- **Fly.io**: `fly launch` (uses Dockerfile), scales to zero on low usage.

Migrations are **run by the container itself** at boot (`npx prisma migrate deploy` before `node dist/server.js`,
see `docker-compose.yml`). Migrations are idempotent — safe on every boot.

## 1. Database

Production Postgres must be managed / cloud-hosted (Supabase works well; any Postgres 14+ with `pgcrypto`
is fine).

1. Create a project and copy the **direct** connection string (Supabase: project → Settings → Database →
   "Connection string" with **Direct connection** selected) and the **pooled** (transaction/Supavisor) URL.
2. Run migrations from your local machine once:

   ```bash
   cd backend
   npx prisma migrate deploy        # uses DATABASE_URL/directUrl from .env
   ```

3. Seed demo data (one-time, dev/qa only):

   ```bash
   npm run prisma:seed              # ts-node build — run locally, NOT in the prod image
   ```

## 2. Required environment variables

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | yes | `postgresql://postgres.<ref>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public` |
| `DIRECT_URL` | yes | same host, port `5432`, **direct connection** (used for migrations) |
| `JWT_SECRET` | yes | strong random 32+ char string |
| `JWT_REFRESH_SECRET` | yes | different random string |
| `ENCRYPTION_KEY` | yes | random 32+ char string (used for sensitive fields) |
| `NODE_ENV` | yes | `production` |
| `PORT` | no | `3000` |
| `CORS_ORIGIN` | no | `https://my-frontend.vercel.app` |
| `AI_SERVICE_URL` | no | `http://my-ai-service:8000` |
| `AI_SERVICE_ENABLED` | no | `false` |
| `JWT_EXPIRES_IN` | no | `7d` |
| `JWT_REFRESH_EXPIRES_IN` | no | `30d` |
| `LOG_LEVEL` | no | `info` |

> **Do not define `max_connections` or pool size in the URL** — keep those in Supabase's own pooler settings.

## 3. Secrets

- Never commit `.env`. Templates live in `.env.example`.
- Generate secrets with `openssl rand -hex 32`.
- In Render/Railway/Fly use the platform's encrypted env/secret store.

## 4. Logging & monitoring

- All logs are **structured JSON** to stdout/stderr (one line per event) — forward them to any log
  platform (Papertrail, Datadog, Grafana Cloud, or plain `journalctl`/platform logs).
- Every request carries a `requestId`; auth events, DB errors and sync failures are logged as
  `auth.*`, `db.error` and `sync.failed` events.
- Health endpoint: `GET /health` → `{"status":"ok",...}` (uptime / readiness probes).

## 5. Safe deployment checklist

1. [ ] `cd backend && npm ci && npm run lint && npm test` (CI does this too)
2. [ ] `npx prisma migrate deploy` against prod DB
3. [ ] Set all required env vars (see table) in the platform secrets store
4. [ ] Deploy the Docker image; container runs migrations at boot (idempotent)
5. [ ] `curl https://<host>/health` → `{"status":"ok"}` and no `Missing required environment variable` in logs
6. [ ] Smoke: `POST /api/auth/login` with a known caregiver, then `GET /api/patients`

## 6. Backing up

Supabase/RDS managed Postgres gives automated backups. For custom Postgres use `pg_dump`:

```bash
pg_dump "$DIRECT_URL" > jugnu_backup.sql
```

## 7. Rollback

- App rollback: redeploy previous image (platform-native for Render/Railway/Fly).
- DB rollback: inverse `prisma migrate` migration added via `npx prisma migrate dev --create-only` is
  required before changing prod schema; never edit an applied migration.