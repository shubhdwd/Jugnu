# Jugnu — Task List & Progress

**Last updated:** 2026-09-09

---

## Backend status
- ✅ Running at `http://localhost:3000`
- ✅ Login/register bug FIXED (validate.middleware.ts)
- ✅ **Route-registration bugs FIXED** (insights/alerts/reminders/personalization)
- ✅ **Refresh token endpoint ADDED** (`POST /api/auth/refresh`)
- ✅ Jest: 35 passed, 0 failed
- ✅ HTTP end-to-end verification: 12/12 fixed endpoints OK

---

## Completed
- [x] Backend setup (Express + TS)
- [x] PostgreSQL + Prisma schema (15 models)
- [x] JWT auth (access + refresh tokens)
- [x] Role-based access (4 roles)
- [x] Patient CRUD (role-scoped)
- [x] 6 cognitive games
- [x] Game sessions + attempts
- [x] AI ability estimation + difficulty + trends
- [x] Personalization system (3 levels)
- [x] Game assets CRUD
- [x] Reminder system
- [x] Cognitive insights
- [x] Alert system
- [x] Family linking
- [x] Health worker tools
- [x] Offline sync
- [x] AES-256 encryption
- [x] Docker setup
- [x] Test suite
- [x] Demo seed data
- [x] **Login/register validation bug FIXED**

---

## Pending — Backend
### Done (this session)
- [x] Fix insights double-prefix bug (`/:patientId/insights` under `/api/patients`)
- [x] Fix alerts double-prefix bug (split patient-scoped router + `adminAlertRouter` under `/api/alerts`)
- [x] Fix reminders list 404 (registered `reminderRouter` → `/api/patients/:patientId/reminders`)
- [x] Fix reminders PATCH/DELETE mount (detail router now under `/api/reminders/:id`)
- [x] Fix personalization GET shadowed (base routes → `/api/patients/:patientId/personalization`)
- [x] Add refresh token endpoint (`POST /api/auth/refresh`)
- [x] Rebuild + restart backend (PID verified on :3000)
- [x] Re-run Jest (35/35) + HTTP end-to-end checks on all fixed routes

### Remaining — Backend
- [x] Personalization simplification DONE — VOICE level removed → 2 levels (GENERIC/FULL); DB migrated, tests 35/35
- [ ] AI Python service (referenced, not implemented)
- [ ] Multi-language (Assamese/Bengali/Meitei — only Assamese seeded)
- [x] Full Playwright API test suite DONE — `tests/e2e/` (20/20): auth 4 roles, refresh/logout, patients, games, insights, sessions, alerts, family, health-worker, sync, personalization, assets, reminders; rate limit bumped to 500/15min

---

## Pending — Other (non-backend)
- [ ] Frontend (not started)

---

## Master Completion Checklist (from Jugnu_Complete, 30 items)
- ✅ Done: Node/Express, TypeScript, PostgreSQL, Prisma, Schema, Auth, Roles, Patients, Consent, Games, Sessions, Attempts, Personalization, AI Ability, Adaptive Difficulty, Personal Baseline, Trend Analysis, Clinical Review, Caregiver Dashboard, Health Worker API, Caregiver Mood, Connected Family, Notifications, Offline Sync, Security, Docker (24)
- ⚠️ Partial: Migrations (db push, no migration files), Language/Voice (Assamese only), Reminders (list bug 404), Tests (no integration/E2E), Logging/Monitoring (morgan only) (5)
- ❌ Backlog: CI/CD, Deployment (2)
