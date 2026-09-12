import { api } from '@/lib/api'

export interface ApiPatient {
  id: string
  name: string
  displayName?: string
  age: number
  gender: string
  language: string
  region?: string
  village?: string
  portraitTone?: string
  voiceEnabled: boolean
  speechRate: number
  morningRoutine: string[]
  caregiverId: string
  createdAt: string
  updatedAt: string
}

export async function getPatients(): Promise<ApiPatient[] | null> {
  return api<ApiPatient[]>('/patients')
}

export async function getPatient(id: string): Promise<ApiPatient | null> {
  return api<ApiPatient>(`/patients/${id}`)
}

export async function createPatient(data: {
  name: string
  age: number
  gender: string
  language?: string
  village?: string
  region?: string
}): Promise<ApiPatient | null> {
  return api<ApiPatient>('/patients', { method: 'POST', json: data })
}

export async function updatePatient(id: string, data: Record<string, unknown>): Promise<ApiPatient | null> {
  return api<ApiPatient>(`/patients/${id}`, { method: 'PATCH', json: data })
}

export async function deletePatient(id: string): Promise<void | null> {
  await api(`/patients/${id}`, { method: 'DELETE' })
}
