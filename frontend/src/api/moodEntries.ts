import { api } from '@/lib/api'

export interface ApiMoodEntry {
  id: string
  patientId: string
  userId: string
  mood: string
  note?: string
  date: string
  createdAt: string
}

export async function getMoodEntries(patientId: string): Promise<ApiMoodEntry[] | null> {
  return api<ApiMoodEntry[]>(`/mood-entries/${patientId}`)
}

export async function getMoodEntriesByUser(patientId: string, userId: string): Promise<ApiMoodEntry[] | null> {
  return api<ApiMoodEntry[]>(`/mood-entries/${patientId}/user/${userId}`)
}

export async function createMoodEntry(data: {
  patientId: string
  mood: string
  note?: string
  date?: string
}): Promise<ApiMoodEntry | null> {
  return api<ApiMoodEntry>('/mood-entries', { method: 'POST', json: data })
}

export async function deleteMoodEntry(id: string): Promise<void | null> {
  await api(`/mood-entries/${id}`, { method: 'DELETE' })
}
