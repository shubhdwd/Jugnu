import { test, expect } from '@playwright/test';
import { USERS, login, authHeaders, uniqueEmail } from './helpers';

test.describe('Auth', () => {
  test('health check', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('jugnu-backend');
  });

  test('all four roles log in successfully', async ({ request }) => {
    for (const role of Object.values(USERS)) {
      const { status, data } = await login(request, role.email, role.password);
      expect(status).toBe(200);
      expect(data.accessToken).toBeTruthy();
      expect(data.refreshToken).toBeTruthy();
      expect(data.user.email).toBe(role.email);
      expect(data.user.role).toBe(role.role);
    }
  });

  test('rejects wrong password', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { identifier: USERS.caregiver.email, password: 'wrongpass' },
    });
    expect(res.status()).toBe(401);
  });

  test('rejects unknown user', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { identifier: 'nobody@test.com', password: 'password123' },
    });
    expect(res.status()).toBe(401);
  });

  test('register -> me -> refresh -> logout', async ({ request }) => {
    const email = uniqueEmail();
    const reg = await request.post('/api/auth/register', {
      data: {
        name: 'Playwright Tester',
        email,
        password: 'Password123!',
        role: 'CONNECTED_FAMILY',
      },
    });
    expect(reg.status()).toBe(201);
    const regBody = await reg.json();
    expect(regBody.data.user.email).toBe(email);

    const { data } = await login(request, email, 'Password123!');
    const me = await request.get('/api/auth/me', { headers: await authHeaders(data.accessToken) });
    expect(me.status()).toBe(200);
    const meBody = await me.json();
    expect(meBody.data.email).toBe(email);

    const refreshed = await request.post('/api/auth/refresh', { data: { refreshToken: data.refreshToken } });
    expect(refreshed.status()).toBe(200);
    const refreshedBody = await refreshed.json();
    expect(refreshedBody.data.accessToken).toBeTruthy();

    const logout = await request.post('/api/auth/logout', {
      data: { refreshToken: refreshedBody.data.refreshToken ?? data.refreshToken },
      headers: await authHeaders(refreshedBody.data.accessToken),
    });
    expect(logout.status()).toBe(200);
  });

  test('protected route rejects without token', async ({ request }) => {
    const res = await request.get('/api/patients');
    expect(res.status()).toBe(401);
  });
});