import { test, expect } from '@playwright/test';
import { USERS, login, authHeaders } from './helpers';

test.describe('Core routes (read-mostly + minimal writes)', () => {
  let caregiverToken: string;
  let adminToken: string;
  let familyToken: string;
  let healthWorkertoken: string;
  let patientId: string;
  let gameId: string;

  test.beforeAll(async ({ request }) => {
    caregiverToken = (await login(request, USERS.caregiver.email, USERS.caregiver.password)).data.accessToken;
    adminToken = (await login(request, USERS.admin.email, USERS.admin.password)).data.accessToken;
    familyToken = (await login(request, USERS.family.email, USERS.family.password)).data.accessToken;
    healthWorkertoken = (await login(request, USERS.healthWorker.email, USERS.healthWorker.password)).data.accessToken;

    const patients = await request.get('/api/patients', { headers: await authHeaders(caregiverToken) });
    const patientsBody = await patients.json();
    patientId = patientsBody.data[0].id;

    const games = await request.get('/api/games', { headers: await authHeaders(caregiverToken) });
    const gamesBody = await games.json();
    gameId = gamesBody.data[0].id;
  });

  test('patients list + detail (caregiver)', async ({ request }) => {
    const h = await authHeaders(caregiverToken);
    const list = await request.get('/api/patients', { headers: h });
    expect(list.status()).toBe(200);
    const listBody = await list.json();
    expect(listBody.data.length).toBeGreaterThan(0);

    const detail = await request.get(`/api/patients/${patientId}`, { headers: h });
    expect(detail.status()).toBe(200);
    const detailBody = await detail.json();
    expect(detailBody.data.id).toBe(patientId);
    expect(detailBody.data.name).toBeTruthy();
  });

  test('games list returns 6 games across GENERIC/FULL', async ({ request }) => {
    const h = await authHeaders(caregiverToken);
    const res = await request.get('/api/games', { headers: h });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(6);
    const levels = [...new Set(body.data.map((g: { personalizationLevel: string }) => g.personalizationLevel))];
    expect(levels.sort()).toEqual(['FULL', 'GENERIC']);
  });

  test('recommended games for a patient', async ({ request }) => {
    const h = await authHeaders(caregiverToken);
    const res = await request.get(`/api/games/recommended/${patientId}`, { headers: h });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data.recommended)).toBe(true);
    expect(body.data.recommended.length).toBeGreaterThan(0);
    expect(body.data.recommended[0].suggestedDifficulty).toBeTruthy();
  });

  test('insights: list, trends, ability', async ({ request }) => {
    const h = await authHeaders(caregiverToken);
    const list = await request.get(`/api/patients/${patientId}/insights`, { headers: h });
    expect(list.status()).toBe(200);
    const trends = await request.get(`/api/patients/${patientId}/trends`, { headers: h });
    expect(trends.status()).toBe(200);
    const ability = await request.get(`/api/patients/${patientId}/ability`, { headers: h });
    expect(ability.status()).toBe(200);
    const abilityBody = await ability.json();
    expect(abilityBody.data.overall).not.toBeNull();
  });

  test('sessions: create, attempt, end, list, mood', async ({ request }) => {
    const h = await authHeaders(caregiverToken);
    const created = await request.post('/api/sessions', {
      headers: h,
      data: { patientId, gameId },
    });
    expect(created.status()).toBe(201);
    const createdBody = await created.json();
    const sessionId = createdBody.data.id;

    const attempt = await request.post(`/api/sessions/${sessionId}/attempts`, {
      headers: h,
      data: {
        questionId: 'q-pw-smoke',
        correct: true,
        responseTimeMs: 1200,
        difficulty: 'EASY',
        score: 10,
      },
    });
    expect(attempt.status()).toBe(201);

    const ended = await request.post(`/api/sessions/${sessionId}/end`, {
      headers: h,
      data: { completionStatus: 'COMPLETED' },
    });
    expect(ended.status()).toBe(200);

    const list = await request.get(`/api/sessions/patients/${patientId}/sessions`, { headers: h });
    expect(list.status()).toBe(200);
    const listBody = await list.json();
    expect(listBody.data.some((s: { id: string }) => s.id === sessionId)).toBe(true);

    const mood = await request.post(`/api/sessions/patients/${patientId}/mood`, {
      headers: h,
      data: { mood: 'HAPPY', notes: 'pw e2e smoke' },
    });
    expect(mood.status()).toBe(201);
  });

  test('alerts: patient list (caregiver), admin list + acknowledge', async ({ request }) => {
    const ch = await authHeaders(caregiverToken);
    const ah = await authHeaders(adminToken);

    const patientAlerts = await request.get(`/api/patients/${patientId}/alerts`, { headers: ch });
    expect(patientAlerts.status()).toBe(200);
    const patientAlertsBody = await patientAlerts.json();
    expect(Array.isArray(patientAlertsBody.data)).toBe(true);

    const adminAlerts = await request.get('/api/alerts', { headers: ah });
    expect(adminAlerts.status()).toBe(200);
    const adminAlertsBody = await adminAlerts.json();
    const target = adminAlertsBody.data[0];
    if (target) {
      const previous = target.status as string;
      const newStatus = previous === 'ACTIVE' ? 'ACKNOWLEDGED' : 'ACTIVE';
      const patched = await request.patch(`/api/alerts/${target.id}`, {
        headers: ah,
        data: { status: newStatus },
      });
      expect(patched.status()).toBe(200);
      const patchedBody = await patched.json();
      expect(patchedBody.data.status).toBe(newStatus);
      const reverted = await request.patch(`/api/alerts/${target.id}`, {
        headers: ah,
        data: { status: previous },
      });
      expect(reverted.status()).toBe(200);
    }
  });

  test('family members list (family role)', async ({ request }) => {
    const h = await authHeaders(familyToken);
    const res = await request.get(`/api/family/members/${patientId}`, { headers: h });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('health worker: me, patients, priority-list, visit-plan', async ({ request }) => {
    const h = await authHeaders(healthWorkertoken);
    const me = await request.get('/api/health-workers/me', { headers: h });
    expect(me.status()).toBe(200);
    const meBody = await me.json();
    expect(meBody.data.id).toBeTruthy();

    const patients = await request.get('/api/health-workers/patients', { headers: h });
    expect(patients.status()).toBe(200);

    const priority = await request.get('/api/health-workers/priority-list', { headers: h });
    expect(priority.status()).toBe(200);

    const visitPlan = await request.get('/api/health-workers/visit-plan', { headers: h });
    expect(visitPlan.status()).toBe(200);
  });

  test('sync: push event + status', async ({ request }) => {
    const h = await authHeaders(caregiverToken);
    const deviceId = `pw-device-${Date.now()}`;
    const pushed = await request.post('/api/sync', {
      headers: h,
      data: {
        deviceId,
        events: [
          {
            eventId: `pw-ev-${Date.now()}`,
            type: 'MOOD_CHECKIN',
            timestamp: new Date().toISOString(),
            payload: { patientId, mood: 'NEUTRAL' },
          },
        ],
      },
    });
    expect(pushed.status()).toBe(200);

    const status = await request.get(`/api/sync/status/${deviceId}`, { headers: h });
    expect(status.status()).toBe(200);
  });

  test('admin can list users', async ({ request }) => {
    const h = await authHeaders(adminToken);
    const res = await request.get('/api/users', { headers: h });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });
});