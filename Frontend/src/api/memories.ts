import { api } from '@/lib/api'

export interface ApiMemory {
  id: string
  patientId: string
  personId?: string
  title: string
  description: string
  photoUrl?: string
  createdByUserId: string
  status: string
  usableInActivities: boolean
  createdAt: string
  updatedAt: string
  voiceNotes?: ApiVoiceNote[]
  person?: { id: string; name: string; relationship: string }
}

export interface ApiVoiceNote {
  id: string
  personId?: string
  memoryId?: string
  audioUrl?: string
  transcript?: string
  seconds: number
  recordedBy: string
  recordedAt: string
}

export async function getMemories(patientId: string, status?: string): Promise<ApiMemory[] | null> {
  const q = status ? `?status=${status}` : ''
  return api<ApiMemory[]>(`/memories/${patientId}${q}`)
}

export async function getMemory(id: string): Promise<ApiMemory | null> {
  return api<ApiMemory>(`/memories/detail/${id}`)
}

export async function createMemory(data: {
  patientId: string
  personId?: string
  title: string
  description: string
  photoUrl?: string
  usableInActivities?: boolean
}): Promise<ApiMemory | null> {
  return api<ApiMemory>('/memories', { method: 'POST', json: data })
}

export async function updateMemory(id: string, data: Record<string, unknown>): Promise<ApiMemory | null> {
  return api<ApiMemory>(`/memories/${id}`, { method: 'PATCH', json: data })
}

export async function deleteMemory(id: string): Promise<void | null> {
  await api(`/memories/${id}`, { method: 'DELETE' })
}

export async function approveMemory(id: string): Promise<ApiMemory | null> {
  return api<ApiMemory>(`/memories/${id}/approve`, { method: 'POST' })
}

export async function declineMemory(id: string): Promise<ApiMemory | null> {
  return api<ApiMemory>(`/memories/${id}/decline`, { method: 'POST' })
}
