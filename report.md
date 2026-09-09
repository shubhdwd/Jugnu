# Jugnu — Project Report

**"Lighting Memories. Strengthening Bonds."**

Cognitive health platform for elderly patients in rural India. Uses gamified cognitive exercises with adaptive difficulty and family/caregiver involvement. **Never diagnoses dementia** — all insights are framed as cognitive ability observations.

---

## Current Status (as of 2026-09-09)

| Area | Status |
|---|---|
| Backend (Express + TS) | ✅ Running at `http://localhost:3000` |
| Database (Supabase PostgreSQL) | ✅ Connected, seeded (5 users, 6 games, 4 patients) |
| Login / Register / Auth | ✅ **FIXED** — verified end-to-end |
| Route registration (insights/alerts/reminders/personalization) | ✅ **FIXED** — 12/12 endpoints HTTP-verified |
| Refresh token endpoint | ✅ **ADDED** — `POST /api/auth/refresh` |
| Backend test suite (Jest) | ✅ 35 passed, 0 failed |
| Frontend | ⬜ Not started |
| AI Python service | ⬜ Referenced, not implemented |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 5 |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| Security | Helmet, CORS, Rate Limiting, bcryptjs |
| Testing | Jest + ts-jest, Playwright |
| Container | Docker (multi-stage Alpine) |

---

## Project Structure

```
D:\SIH\
├── .gitignore
├── env (1)                          # Supabase DB + API config
├── Jugnu_Complete_Backend_Architecture.pdf
├── report.md                        # This file
│
└── backend/
    ├── Dockerfile                   # Multi-stage Node 20 Alpine
    ├── docker-compose.yml           # PostgreSQL + backend
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.seed.json
    ├── jest.config.js
    ├── README.md
    │
    ├── prisma/
    │   ├── schema.prisma            # 15 models, 13 enums
    │   └── seed.ts                  # Demo data seeder
    │
    ├── src/
    │   ├── app.ts                   # Express app config
    │   ├── server.ts                # Entry point
    │   │
    │   ├── config/
    │   │   ├── database.ts          # Prisma singleton
    │   │   └── env.ts               # Env vars + validation
    │   │
    │   ├── middleware/
    │   │   ├── auth.middleware.ts    # JWT verification
    │   │   ├── role.middleware.ts    # RBAC check
    │   │   ├── validate.middleware.ts # Zod validation (FIXED)
    │   │   └── error.middleware.ts   # Global error handler
    │   │
    │   ├── services/
    │   │   ├── ai.service.ts        # Ability estimation, difficulty, trends
    │   │   ├── encryption.service.ts # AES-256-CBC
    │   │   ├── notification.service.ts # Alerts + reminders
    │   │   └── sync.service.ts      # Offline-first sync
    │   │
    │   ├── modules/
    │   │   ├── auth/                # Register, login, logout, me
    │   │   ├── users/               # User list (admin only)
    │   │   ├── patients/            # Patient CRUD + access control
    │   │   ├── games/               # Game catalog + recommendations
    │   │   ├── sessions/            # Game sessions + attempts
    │   │   ├── personalization/     # Patient personalization + game assets
    │   │   ├── reminders/           # Medication/activity reminders
    │   │   ├── insights/            # Cognitive ability insights
    │   │   ├── alerts/              # Clinical + caregiver alerts
    │   │   ├── family/              # Family member linking
    │   │   ├── health-workers/      # Health worker tools
    │   │   └── sync/                # Offline event sync
    │   │
    │   ├── types/
    │   │   └── express.d.ts         # Express user type
    │   │
    │   └── utils/
    │       ├── api-response.ts      # sendSuccess, sendError, sendPaginated
    │       ├── errors.ts            # Custom error classes
    │       └── logger.ts            # Morgan + console logger
    │
    └── tests/
        ├── ai.service.test.ts
        ├── encryption.service.test.ts
        ├── games.test.ts
        ├── personalization.test.ts
        ├── sessions.test.ts
        └── utils.test.ts
```

---

## User Roles & Access

| Role | Access |
|---|---|
| **ADMIN** | Full access — all patients, all alerts, user management |
| **FAMILY_CAREGIVER** | Creates/manages their own patients, games, sessions |
| **CONNECTED_FAMILY** | View-only access to linked patients |
| **HEALTH_WORKER** | View patients in their village, priority list, visit plan |

---

## Database Models (15)

| Model | Purpose |
|---|---|
| `User` | All users (admin, caregivers, family, health workers) |
| `Patient` | Elderly patients linked to a caregiver |
| `Consent` | Per-patient consent tracking (6 types) |
| `Game` | 6 cognitive games with config |
| `Session` | Game play session (patient + game + time) |
| `Attempt` | Individual question attempt in a session |
| `Personalization` | Patient personalization settings (level, voice, photos) |
| `GameAsset` | Personalized content (voice clips, photos, routine steps) |
| `Reminder` | Medication/activity reminders |
| `CaregiverMoodCheckin` | Caregiver mood tracking |
| `Insight` | Cognitive ability estimates per domain |
| `Alert` | Clinical review + caregiver support alerts |
| `FamilyMember` | Patient ↔ family user links |
| `HealthWorker` | Health worker profile (area, type) |
| `SyncEvent` | Offline sync event log |
| `ResourcePack` | Language content packs |

---

## 6 Cognitive Games

| Game | Type | Category | Personalization |
|---|---|---|---|
| Object Match | OBJECT_MATCH | OBJECT_RECOGNITION | Generic |
| Routine Sequencing | ROUTINE_SEQUENCING | SEQUENCING | Generic |
| Pattern Recall | PATTERN_RECALL | PATTERN_RECALL | Generic |
| Who's Calling? | WHO_IS_CALLING | REMINISCENCE | Full |
| Remember When | REMEMBER_WHEN | REMINISCENCE | Full |
| My Daily Routine | MY_DAILY_ROUTINE | PERSONALIZED_ROUTINE | Full |

### Current Personalization Levels (2 levels)
- **GENERIC** — Zero setup, pre-built content
- **FULL** — Photos + voice + personal routines (merges former VOICE + FULL)

### Planned Personalization
- **Level 1: Generic** — Same as current GENERIC
- **Level 2: Full Personalisation** — Merges current VOICE + FULL
- **VOICE level REMOVED (2026-09-09)** — schema/seed/code/tests updated, DB migrated

---

## API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh        (body: { refreshToken })
POST   /api/auth/logout        (auth required)
GET    /api/auth/me            (auth required)
```

### Patients
```
POST   /api/patients                    (caregiver, admin)
GET    /api/patients                    (scoped by role)
GET    /api/patients/:id
PATCH  /api/patients/:id                (caregiver, admin)
DELETE /api/patients/:id                (caregiver, admin)
```

### Games
```
GET    /api/games                       (filter: type, category, language, active)
GET    /api/games/:id
GET    /api/games/slug/:slug
GET    /api/games/recommended/:patientId
```

### Sessions
```
POST   /api/sessions
POST   /api/sessions/:id/attempts
POST   /api/sessions/:id/end
GET    /api/sessions/:id
GET    /api/sessions/patients/:patientId/sessions
POST   /api/sessions/patients/:patientId/mood
```

### Personalization
```
GET    /api/patients/:patientId/personalization
POST   /api/patients/:patientId/personalization
PATCH  /api/patients/:patientId/personalization
GET    /api/patients/:patientId/assets
GET    /api/patients/:patientId/assets/:assetId
POST   /api/patients/:patientId/assets
PATCH  /api/patients/:patientId/assets/:assetId
DELETE /api/patients/:patientId/assets/:assetId
```

### Reminders
```
GET    /api/patients/:patientId/reminders
POST   /api/patients/:patientId/reminders
PATCH  /api/reminders/:id
DELETE /api/reminders/:id
```

### Insights
```
GET    /api/patients/:patientId/insights
GET    /api/patients/:patientId/trends
GET    /api/patients/:patientId/ability
```

### Alerts
```
GET    /api/patients/:patientId/alerts
PATCH  /api/alerts/:id
GET    /api/alerts                      (admin, health worker)
```

### Family
```
POST   /api/family
GET    /api/family/members/:patientId
DELETE /api/family/member/:id
```

### Health Workers
```
GET    /api/health-workers/me
GET    /api/health-workers/patients
GET    /api/health-workers/priority-list
GET    /api/health-workers/visit-plan
```

### Sync
```
POST   /api/sync
GET    /api/sync/status/:deviceId
POST   /api/sync/retry/:deviceId
```

> **Note:** All paths above are live and verified as of 2026-09-09 after the route-registration fixes. The earlier double `/patients/` prefix and missing routes are resolved (see Bug Log).

---

## AI Service Logic

### Ability Estimation
- Starts at 0.5 (baseline)
- Weighted by difficulty (EASY=0.2, MEDIUM=0.5, HARD=0.8)
- Recency decay factor: 0.85
- Adjusts per attempt based on correctness vs expected

### Difficulty Selection
- ability > 0.8 → HARD
- ability > 0.5 → MEDIUM
- ability <= 0.3 → EASY
- 2 consecutive failures → force EASY (regardless of ability)

### Trend Detection
- Uses linear regression on ability estimates
- Slope > 0.05 → IMPROVING
- Slope < -0.05 → DECLINING
- Otherwise → STABLE

### Sustained Decline Alert
- 3+ consecutive declines in same cognitive domain → creates HIGH severity clinical review alert

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| DATABASE_URL | Yes | — | PostgreSQL connection string |
| DIRECT_URL | Yes | — | Direct PostgreSQL connection (bypasses pgbouncer) |
| JWT_SECRET | Yes | — | JWT access token secret |
| JWT_REFRESH_SECRET | Yes | — | JWT refresh token secret |
| ENCRYPTION_KEY | Yes | — | AES encryption key |
| PORT | No | 3000 | Server port |
| NODE_ENV | No | development | Environment mode |
| AI_SERVICE_URL | No | localhost:8000 | Python AI service URL |
| AI_SERVICE_ENABLED | No | false | Enable external AI calls |
| CORS_ORIGIN | No | localhost:5173 | Allowed CORS origin |
| LOG_LEVEL | No | info | Log level |

---

## Demo Accounts (after seeding)

| Role | Phone | Email | Password |
|---|---|---|---|
| ADMIN | 9000000000 | admin@jugnu.org | admin123 |
| FAMILY_CAREGIVER | 9000000001 | caregiver1@test.com | password123 |
| FAMILY_CAREGIVER | 9000000002 | caregiver2@test.com | password123 |
| CONNECTED_FAMILY | 9000000003 | family1@test.com | password123 |
| HEALTH_WORKER | 9000000004 | healthworker@test.com | password123 |

---

## Seed Data

- 5 users (1 admin, 2 caregivers, 1 family, 1 health worker)
- 4 patients (Lakshmi Devi, Gopal Bora, Sunita Devi, Ibodhom Singh)
- 6 games
- 12 game assets (voice clips, photos, routine steps)
- 13 sessions with ~100+ attempts
- 12 cognitive insights
- 4 reminders
- 2 alerts
- 6 mood checkins
- 3 personalizations (FULL, FULL, GENERIC)

---

## Bug Log

### ✅ FIXED — Login/Register validation bug (2026-09-09)
- **Root cause:** Route Zod schemas wrap the payload as `z.object({ body: z.object({...}) })`, but `validate.middleware.ts` parsed `req.body` against that wrapper and stored the whole wrapper back, so controllers read `req.body.identifier` → `undefined` → Prisma 500 on login.
- **Fix:** `src/middleware/validate.middleware.ts` now detects the `body`-wrapper shape (via `_def.shape()`, since `shape` is a **function** in Zod 3, not an object), validates the raw payload against the inner `body` schema, and assigns the parsed inner object to `req.body`. Clients post directly `{ identifier, password }`.
- **Verified:**
  - ✅ Login → 200 + `accessToken` + `refreshToken` (Anita Sharma, FAMILY_CAREGIVER)
  - ✅ Wrong password → 401
  - ✅ Register → 201 + token; duplicate phone → 409
  - ✅ `/api/auth/me` with Bearer token → user profile
  - ✅ `/api/games` → 6 games; `/api/patients` → role-scoped (2 for caregiver); game assets; sessions (4)
  - ✅ **Playwright API suite: 20/20 passed (committed)** — `backend/tests/e2e/` (`npm run test:e2e`), covers auth (4 roles), refresh/logout, patients, games, insights/trends/ability, sessions+mood, alerts (status update), family, health-worker APIs, sync, personalization (FULL upsert, VOICE rejected), assets, reminders CRUD with cleanup
  - ✅ **Backend Jest suite: 35 passed, 0 failed** (no regressions)
- **Backend rebuilt and running** at `http://localhost:3000`.

### 🐛 OPEN — Route registration mismatches (pre-existing, NOT fixed)
These existed before the login fix; auth/login are unaffected. Found during verification:
1. **Insights/alerts double-prefix:** `insights.routes.ts` / `alerts.routes.ts` define paths starting with `/patients/...` but are mounted under `/api/patients`. Real URL is `/api/patients/patients/:id/insights` (works); documented `/api/patients/:id/insights` → 404.
2. **Reminders list never registered:** `reminders.routes.ts` exports `reminderRouter` (GET/POST list), but `app.ts` imports only default `reminderDetailRouter`. `GET /api/patients/:id/reminders` → 404.
3. **Personalization GET shadowed:** `personalizationRoutes` `/:patientId` GET is registered after `patientRoutes` `/:id`, so `GET /api/patients/:id` returns the patient, never the personalization.
4. **Personalization/reminders paths** defined as bare `/:patientId`, so documented sub-paths already work where reachable otherwise.
- **Fix needed:** Normalize mount paths in `app.ts` + each module's route definitions to match the documented `/api/patients/:id/...` shape.

### ✅ FIXED — Route-registration bugs (2026-09-09)
- **Root cause:** Routers were mounted with mismatched prefixes (insights/alerts used a `patients/...` prefix on top of a `/api/patients` mount → double prefix), the reminders list router was never registered, and personalization's bare `:patientId` routes collided with patient detail/update routes.
- **Fix:**
  - `insights.routes.ts` → paths `/:patientId/insights|trends|ability`, mounted at `/api/patients`.
  - `alerts.routes.ts` → split into default patient router (`/:patientId/alerts` under `/api/patients`) + `adminAlertRouter` (`GET /` and `PATCH /:id` under `/api/alerts`).
  - `reminders.routes.ts` → list router paths `/:patientId/reminders` registered under `/api/patients`; detail router mounted under `/api/reminders` (`PATCH/DELETE /:id`).
  - `personalization.routes.ts` → base routes moved from bare `/:patientId` to `/:patientId/personalization` (README already documented this shape) so they no longer collide with `GET/PATCH /api/patients/:id`. `/assets` routes unchanged.
  - `auth.routes.ts` + controller → added `POST /api/auth/refresh` (service `refreshTokens()` existed but had no route).
- **Verified (live at `http://localhost:3000`):**
  - ✅ `GET /api/patients/:id/insights|trends|ability` — 200
  - ✅ `GET /api/patients/:id/alerts` — 200; `PATCH /api/alerts/:id` — 200; `GET /api/alerts` (admin) — 200
  - ✅ `GET/POST /api/patients/:id/reminders` — 200; `PATCH/DELETE /api/reminders/:id` — 200
  - ✅ `GET/POST/PATCH /api/patients/:id/personalization` — 200; `GET /api/patients/:id/assets` — 200
  - ✅ `GET /api/patients/:id` (patient detail) unaffected — 200
  - ✅ Legacy double-prefix path `/api/patients/patients/:id/insights` — 404 (cleaned up)
  - ✅ `POST /api/auth/refresh` — returns fresh access + refresh tokens; new access token works on `/api/auth/me`
  - ✅ Jest suite: 35 passed, 0 failed (no regressions)
- **Backend rebuilt and running** at `http://localhost:3000`.

---

## Completed Features Checklist

- [x] Express.js backend setup with TypeScript
- [x] PostgreSQL + Prisma ORM with full schema
- [x] JWT authentication (access + refresh tokens)
- [x] Role-based access control (4 roles)
- [x] Patient CRUD with role-scoped access
- [x] 6 cognitive games with config
- [x] Game session tracking with attempts
- [x] AI ability estimation (weighted, recency-decay)
- [x] Adaptive difficulty selection
- [x] Trend detection (linear regression)
- [x] Sustained decline detection → auto alert
- [x] Personalization system (3 levels)
- [x] Game assets CRUD (voice, photos, routine steps)
- [x] Reminder system (medication, hydration, activity, appointment)
- [x] Cognitive insights per domain
- [x] Alert system (clinical review + caregiver support)
- [x] Family member linking
- [x] Health worker tools (priority list, visit plan)
- [x] Offline-first sync with idempotent events
- [x] AES-256-CBC encryption service
- [x] Rate limiting + Helmet security
- [x] Zod validation on all routes
- [x] Global error handling middleware
- [x] Docker setup (Dockerfile + docker-compose)
- [x] Test suite (6 test files)
- [x] Demo seed data
- [x] **Login/Register bug fixed & verified (Playwright 8/8, Jest 35)**
- [x] **Route-registration bugs fixed & HTTP-verified 12/12**
- [x] **Refresh token endpoint added (`POST /api/auth/refresh`)**

---

## Master Completion Checklist (from Jugnu_Complete Backend Architecture, 30 items)

| # | Item | Status |
|---|---|---|
| 1 | Node + Express setup | ✅ |
| 2 | TypeScript | ✅ |
| 3 | PostgreSQL | ✅ Supabase |
| 4 | Prisma | ✅ |
| 5 | Database schema | ✅ |
| 6 | Migrations | ⚠️ Uses `prisma db push`, no migration files |
| 7 | Auth | ✅ (login bug fixed) |
| 8 | Roles / Permissions | ✅ |
| 9 | Patients | ✅ |
| 10 | Consent | ✅ |
| 11 | Games | ✅ |
| 12 | Sessions | ✅ |
| 13 | Attempts / Performance | ✅ |
| 14 | Personalization | ✅ (2 levels: GENERIC, FULL) |
| 15 | Language / Voice assets | ⚠️ Assamese only seeded |
| 16 | AI Ability Estimation | ✅ (ai.service.ts) |
| 17 | Adaptive Difficulty | ✅ |
| 18 | Personal Baseline | ✅ |
| 19 | Trend Analysis | ✅ |
| 20 | Suggested Clinical Review | ✅ (decline → alert) |
| 21 | Caregiver Dashboard APIs | ✅ |
| 22 | Health Worker APIs | ✅ |
| 23 | Reminders | ✅ List + create + update + delete all live (was ⚠️ list 404) |
| 24 | Caregiver Mood | ✅ |
| 25 | Connected Family | ✅ |
| 26 | Notifications | ✅ (service) |
| 27 | Offline Sync | ✅ |
| 28 | Security | ✅ |
| 29 | Tests | ✅ 35 unit pass + Playwright E2E 20/20 (committed `tests/e2e/`); integration layer pending |
| 30 | Docker | ✅ |
| — | CI/CD | ❌ Not done |
| — | Deployment | ❌ Not done |
| — | Logging / Monitoring | ⚠️ Morgan + console only |

**Summary:** ✅ 27 fully done · ⚠️ 3 partial (Migrations, Language/voice, Tests-integration) · ⚠️ +1 extra (Logging/Monitoring) · ❌ 2 backlog (CI/CD, Deployment)

---

## Pending / In Progress

- [x] **Route-registration bugs FIXED** (insights/alerts/reminders/personalization) — see Bug Log
- [x] **Refresh token endpoint ADDED** — `POST /api/auth/refresh`
- [x] **Personalization simplification DONE** — VOICE level removed, collapsed to 2 levels (GENERIC/FULL); schema, seed, recommendation logic, zod validation, sync service, tests, and live DB all updated
- [x] **Playwright API suite COMMITTED** (`tests/e2e/`, 20/20) + rate limit raised 100→500 req/15min per IP so the suite doesn't self-throttle
- [ ] **Frontend** — not started yet
- [ ] **AI Python service** — referenced but not implemented
- [ ] **Multi-language** — Assamese seeded; Bengali, Meitei planned

---

## Target Users

- **Elderly patients** in rural Assam, Manipur, Bengal
- **Family caregivers** managing patient care
- **Connected family** members (view-only)
- **ASHA/ANM health workers** doing village visits

## Target Languages

- Assamese (default)
- Bengali
- Meitei (Manipuri)
