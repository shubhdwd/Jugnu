import { api } from '@/lib/api'

export interface ApiUser {
  id: string
  name: string
  phone?: string
  email?: string
  role: string
  pin?: string
  layer?: number
  portraitTone?: string
  callsPatient?: string
  canSeeTrends?: boolean
  visibleMemoryIds?: string[]
  createdAt: string
  updatedAt?: string
}

export async function getUsers(): Promise<ApiUser[] | null> {
  return api<ApiUser[]>('/users')
}

export async function getUser(id: string): Promise<ApiUser | null> {
  return api<ApiUser>(`/users/${id}`)
}

export async function updateUser(id: string, data: Record<string, unknown>): Promise<ApiUser | null> {
  return api<ApiUser>(`/users/${id}`, { method: 'PATCH', json: data })
}
