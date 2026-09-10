# Jugnu — Task List & Progress

**Last updated:** 2026-09-10

---

## Backend status
- ✅ Running at `http://localhost:3000`
- ✅ Login/register bug FIXED (validate.middleware.ts)
- ✅ **Route-registration bugs FIXED** (insights/alerts/reminders/personalization)
- ✅ **Refresh token endpoint ADDED** (`POST /api/auth/refresh`)
- ✅ Jest: 35 passed, 0 failed
- ✅ HTTP end-to-end verification: 12/12 fixed endpoints OK
- ✅ **Full live demo (2026-09-10):** 62/62 checks PASS, 42 endpoints, 5 roles — see `demo.md`
- ✅ **Health-worker seed scoping FIXED:** `area: "Kamrup Rural"` → `"Hajo"`
- ✅ **Consent API BUILT** (3 files + mounted) — full CRUD verified 6/6
- ✅ **Notification API BUILT** (schema + migration + 3 files + mounted) — dead `notification.service.ts` wired up, verified 6/6
- ✅ **Sync bug FIXED** — SESSION_START without `offlineEventId` now processes successfully (falls back to sessionId lookup)
- ✅ **New-feature sweep:** 19/19 PASS (consents + notifications + sync fix), Playwright 20/20, Jest 35/35
- ✅ **Python AI service BUILT** (`D:\SIH\ai-service`) — FastAPI, port 8000, PDF §23 compliant; backend bridge + fallback; pytest 29/29, live integration verified
- ✅ **7 demo users ADDED** (`prisma/add-demo-users.ts`, `npm run add:users`) — demo1–demo7@test.com, no "Krishna"; total **19 users**; full sweep re-verified **80/80 PASS**

---

## Completed
- [x] Backend setup (Express + TS)
- [x] PostgreSQL + Prisma schema (16 models)
- [x] JWT auth (access + refresh tokens)
- [x] Role-based access (4 roles)
- [x] Patient CRUD (role-scoped)
- [x] 6 cognitive games
- [x] Game sessions + attempts
- [x] AI ability estimation + difficulty + trends
- [x] Personalization system (2 levels: GENERIC, FULL)
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
- [x] **Route-registration bugs FIXED**
- [x] **Refresh token endpoint ADDED**
- [x] **Personalization simplification DONE**
- [x] **Playwright API test suite DONE** (20/20)
- [x] **Multi-language seeded** (Assamese/Bengali/Meitei)
- [x] **Full live demo sweep** (62/62 PASS)
- [x] **Consent API DONE** (6 endpoints verified)
- [x] **Notification API DONE** (model + migration + 5 endpoints verified)
- [x] **Sync bug FIXED** (SESSION_START offlineEventId guard)

---

## Pending — Backend (next session)

### Done (2026-09-10)
- [x] ~~Priority 1: Build Consent API~~ — `src/modules/consents/` → GET/POST `/api/patients/:patientId/consents` + GET/PATCH/DELETE `/api/consents/:id`. 6 consent types, unique `patientId+consentType` upsert. Verified 6/6.
- [x] ~~Priority 2: Build Notification API~~ — `Notification` model + migration `20260910093612_add_notifications` + `src/modules/notifications/`. `notification.service.ts` `createNotification()` now writes to DB. Verified 6/6.
- [x] ~~Priority 3: Fix Sync Bug~~ — `sync.service.ts` SESSION_START guards undefined `offlineEventId` (falls back to `sessionId` lookup). Verified live.
- [x] ~~Priority 4: Build Python AI service~~ — `D:\SIH\ai-service` (FastAPI + uvicorn, port 8000). Endpoints: `/health`, `/ability`, `/difficulty`, `/trend`, `/decline`, `/explain`, `/analyze-session` — mirror of TS heuristics. Backend: `src/services/ai.client.ts` (HTTP bridge, 2s timeout), `ai.service.ts` now exports `*Remote` wrappers used in `selectNextActivity`, `analyzeSession`, `games.service` (recommended difficulty) and `insights.service` (trends). `AI_SERVICE_ENABLED=true` → Python; false/unreachable → TS fallback (no bug). pytest 29/29 PASS; Jest 35/35 PASS; live integration verified (Python log showed `/ability /trend /explain /decline` 200).

### Remaining Backend
- [ ] Integration tests (unit 35 + E2E 20 done, integration layer missing)
- [ ] Logging/Monitoring (only Morgan)

---

## Pending — Non-backend
- [ ] Frontend (not started)

---

## Master Completion Checklist (from Jugnu_Complete, 30 items)
- ✅ Done: Node/Express, TypeScript, PostgreSQL, Prisma, Schema, Auth, Roles, Patients, Games, Sessions, Attempts, Personalization, AI Ability, Adaptive Difficulty, Personal Baseline, Trend Analysis, Clinical Review, Caregiver Dashboard, Health Worker API, Caregiver Mood, Connected Family, Offline Sync, Security, Reminders, Docker, Deployment, CI/CD, **Consent, Notifications, Sync bug fix, Python AI service** (31)
- ⚠️ Partial: Tests (integration missing)
- ⚠️ Extra: Logging/Monitoring (morgan only)
