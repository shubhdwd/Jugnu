import { api } from '@/lib/api'

export interface LoginResponse {
  user: { id: string; name: string; phone?: string; email?: string; role: string }
  accessToken: string
  refreshToken: string
}

export interface RegisterResponse extends LoginResponse {}

export async function login(identifier: string, password: string): Promise<LoginResponse | null> {
  return api<LoginResponse>('/auth/login', {
    method: 'POST',
    json: { identifier, password },
  })
}

export async function register(data: {
  name: string
  email?: string
  phone?: string
  password: string
  role?: string
}): Promise<RegisterResponse | null> {
  return api<RegisterResponse>('/auth/register', {
    method: 'POST',
    json: data,
  })
}

export async function getMe(): Promise<{ id: string; name: string; phone?: string; email?: string; role: string } | null> {
  return api('/auth/me')
}

export async function logout(refreshToken?: string): Promise<void | null> {
  await api('/auth/logout', { method: 'POST', json: { refreshToken } })
}
