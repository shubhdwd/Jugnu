import { APIRequestContext } from '@playwright/test';

export const USERS = {
  admin: { email: 'admin@jugnu.org', password: 'admin123', role: 'ADMIN' },
  caregiver: { email: 'caregiver1@test.com', password: 'password123', role: 'FAMILY_CAREGIVER' },
  family: { email: 'family1@test.com', password: 'password123', role: 'CONNECTED_FAMILY' },
  healthWorker: { email: 'healthworker@test.com', password: 'password123', role: 'HEALTH_WORKER' },
} as const;

export async function login(request: APIRequestContext, email: string, password: string) {
  const res = await request.post('/api/auth/login', {
    data: { identifier: email, password },
  });
  if (res.status() !== 200) {
    throw new Error(`login failed for ${email}: HTTP ${res.status()} ${await res.text()}`);
  }
  const json = await res.json();
  return { status: res.status(), body: json, data: json.data };
}

export async function authHeaders(token: string): Promise<Record<string, string>> {
  return { Authorization: `Bearer ${token}` };
}

export function uniqueEmail(): string {
  return `pw_e2e_${Date.now()}@test.com`;
}

export async function expectApiError(res: { status(): number }, allowed: number[]) {
  if (!allowed.includes(res.status())) {
    throw new Error(`unexpected status ${res.status()}; allowed ${allowed.join(',')}`);
  }
}