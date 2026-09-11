import { test, expect } from '@playwright/test';
import { USERS, login, authHeaders } from './helpers';

test.describe('Personalization, assets & reminders (write + cleanup)', () => {
  let caregiverToken: string;
  let patientId: string;
  let gameId: string;

  test.beforeAll(async ({ request }) => {
    caregiverToken = (await login(request, USERS.caregiver.email, USERS.caregiver.password)).data.accessToken;
    const patients = await request.get('/api/patients', { headers: await authHeaders(caregiverToken) });
    const patientsBody = await patients.json();
    patientId = patientsBody.data[0].id;

    const games = await request.get('/api/games', { headers: await authHeaders(caregiverToken) });
    const gamesBody = await games.json();
    gameId = gamesBody.data[0].id;
  });

  test('personalization: get, upsert FULL, reject VOICE', async ({ request }) => {
    const h = await authHeaders(caregiverToken);

    const get = await request.get(`/api/patients/${patientId}/personalization`, { headers: h });
    expect(get.status()).toBe(200);
    const getBody = await get.json();
    expect(['GENERIC', 'FULL']).toContain(getBody.data.level);

    const post = await request.post(`/api/patients/${patientId}/personalization`, {
      headers: h,
      data: { level: 'FULL', preferences: { preferredDifficulty: 'MEDIUM', soundEnabled: true } },
    });
    expect(post.status()).toBe(200);
    const postBody = await post.json();
    expect(postBody.data.level).toBe('FULL');

    const bad = await request.patch(`/api/patients/${patientId}/personalization`, {
      headers: h,
      data: { level: 'VOICE' },
    });
    expect(bad.status()).toBe(400);
  });

  test('game assets: list, create, get, update, delete', async ({ request }) => {
    const h = await authHeaders(caregiverToken);
    const list = await request.get(`/api/patients/${patientId}/assets`, { headers: h });
    expect(list.status()).toBe(200);
    const listBody = await list.json();
    expect(Array.isArray(listBody.data)).toBe(true);

    const created = await request.post(`/api/patients/${patientId}/assets`, {
      headers: h,
      data: {
        gameId,
        contentType: 'voice',
        label: 'pw e2e voice asset',
        fileUrl: 'https://example.com/pw-smoke.mp3',
        transcript: 'smoke test clip',
      },
    });
    expect(created.status()).toBe(201);
    const createdBody = await created.json();
    const assetId = createdBody.data.id;

    const fetched = await request.get(`/api/patients/${patientId}/assets/${assetId}`, { headers: h });
    expect(fetched.status()).toBe(200);

    const updated = await request.patch(`/api/patients/${patientId}/assets/${assetId}`, {
      headers: h,
      data: { label: 'pw e2e voice asset (updated)' },
    });
    expect(updated.status()).toBe(200);

    const deleted = await request.delete(`/api/patients/${patientId}/assets/${assetId}`, { headers: h });
    expect(deleted.status()).toBe(200);

    const after = await request.get(`/api/patients/${patientId}/assets/${assetId}`, { headers: h });
    expect(after.status()).toBe(404);
  });

  test('reminders: create, list, get, update, delete (full cleanup)', async ({ request }) => {
    const h = await authHeaders(caregiverToken);

    const created = await request.post(`/api/patients/${patientId}/reminders`, {
      headers: h,
      data: {
        type: 'ACTIVITY',
        title: 'pw e2e reminder',
        message: 'smoke test reminder',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
        repeatRule: 'DAILY',
      },
    });
    expect(created.status()).toBe(201);
    const createdBody = await created.json();
    const reminderId = createdBody.data.id;

    const list = await request.get(`/api/patients/${patientId}/reminders`, { headers: h });
    expect(list.status()).toBe(200);
    const listBody = await list.json();
    expect(listBody.data.some((r: { id: string }) => r.id === reminderId)).toBe(true);

    const patched = await request.patch(`/api/reminders/${reminderId}`, {
      headers: h,
      data: { title: 'pw e2e reminder (updated)' },
    });
    expect(patched.status()).toBe(200);

    const deleted = await request.delete(`/api/reminders/${reminderId}`, { headers: h });
    expect(deleted.status()).toBe(200);
  });

  test('reminders: reject invalid type and missing body', async ({ request }) => {
    const h = await authHeaders(caregiverToken);
    const badType = await request.post(`/api/patients/${patientId}/reminders`, {
      headers: h,
      data: { type: 'BOGUS', title: 'x', message: 'y', scheduledAt: new Date().toISOString() },
    });
    expect(badType.status()).toBe(400);

    const missing = await request.post(`/api/patients/${patientId}/reminders`, {
      headers: h,
      data: {},
    });
    expect(missing.status()).toBe(400);
  });
});