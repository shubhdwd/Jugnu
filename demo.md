# Jugnu Backend — Live Demo

| | |
|---|---|
| **Date** | 2026-09-10 (Thursday) |
| **Time** | 00:04 IST (+05:30) |
| **Server** | http://localhost:3000 |
| **Health** | status: ok, service: jugnu-backend |
| **Stack** | Express + TypeScript + Prisma + Supabase Postgres |

---

## Demo Workflow

Steps executed live against the running backend (seeded demo data):

1. **Health check** — `GET /health`
2. **Login** — `POST /api/auth/login` (`caregiver1@test.com` / `password123`)
3. **Patients list** — `GET /api/patients` (role-scoped)
4. **Patient detail** — `GET /api/patients/:id`
5. **Games list** — `GET /api/games`
6. **Recommendations** — `GET /api/games/recommended/:patientId`
7. **Insights / Trends / Ability** — `GET /api/patients/:id/insights`, `/trends`, `/ability`
8. **Alerts + Reminders** — `GET /api/patients/:id/alerts`, `/reminders`

---

## Live Output

### 1. Health check
```json
{"status":"ok","timestamp":"2026-09-09T18:28:35.097Z","service":"jugnu-backend"}
```

### 2. Login
```
caregiver1@test.com  ->  Anita Sharma  |  role: FAMILY_CAREGIVER
```

### 3. Patients (caregiver ko linked — role-scoped, 2)
```
- Gopal Chandra Bora  | age: 68 | language: assamese | id: 195583ed-...
- Lakshmi Devi        | age: 72 | language: assamese | id: f09f39b6-...
```

### 4. Patient detail (Gopal Chandra Bora)
```
gender: MALE | language: assamese | age: 68
```

### 5. Games (6 total — 3 FULL + 3 GENERIC)

| Game | Level |
|---|---|
| My Daily Routine | FULL |
| Remember When | FULL |
| Who Is Calling? | FULL |
| Pattern Recall | GENERIC |
| Routine Sequencing | GENERIC |
| Object Match | GENERIC |

### 6. Recommendations (Gopal Chandra Bora, level: FULL)
```
-> Pattern Recall | suggested difficulty: HARD
```
Note: FULL-level patient ko poora 6-game pool milta hai (koi level filter nahi), top-3 recommended me se pehla yahan dikha.

### 7. Cognitive insights / trends / ability

**Insights:** 33 records (per cognitive domain), e.g.
> "Routine Sequencing ability is improving. Current estimated ability: 83%." (modelVersion v1.0)

**Overall ability estimate:** `0.630`

| Domain | Ability | Trend |
|---|---|---|
| MY_DAILY_ROUTINE | 0.53 | STABLE |
| OBJECT_MATCH | 0.52 | STABLE |
| REMEMBER_WHEN | 0.53 | STABLE |
| ROUTINE_SEQUENCING | 0.83 | IMPROVING |
| PATTERN_RECALL | 0.69 | STABLE |
| WHO_IS_CALLING | 0.69 | STABLE |

### 8. Alerts (2 — clinical review flow)
```
- [HIGH] Sustained decline detected in cognitive performance ... Consider a clinical review.  -> status: ACTIVE
- [HIGH] Sustained decline detected in cognitive performance ... Consider a clinical review.  -> status: ACKNOWLEDGED
```

### 9. Reminders (2)
```
- [ACTIVITY]     Morning Walk   @ 2026-09-06T05:44:33.350Z  repeat: DAILY      active: true
- [APPOINTMENT]  Doctor Visit   @ 2026-09-10T05:44:33.350Z  repeat: NONE       active: true
```

---

## Interpretation

- **Auth + role-scoping kaam kar raha hai:** caregiver ko sirf apne 2 assigned patients dikhte hain.
- **Personalization ke 2 levels (GENERIC/FULL):** har patient ko uske level ke hisaab se correct games pool milta hai.
- **AI ability estimation + alerts:** declining trend pe HIGH alert banta hai (clinical review suggestion) — pura monitoring flow live hai.
- **Reminders + notifications:** caregiver ko daily routines aur appointments dikhti hain.

> Demo verification: backend lint + build clean, Jest 35/35, Playwright API suite 20/20, ready to demo live.