import { api } from '@/lib/api'

export interface ApiPerson {
  id: string
  patientId: string
  name: string
  relationship: string
  photoUrl?: string
  portraitTone: string
  isPatient: boolean
  createdAt: string
  updatedAt: string
  voiceNotes?: ApiVoiceNote[]
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

export async function getPeople(patientId: string): Promise<ApiPerson[] | null> {
  return api<ApiPerson[]>(`/people/${patientId}`)
}

export async function createPerson(data: {
  patientId: string
  name: string
  relationship: string
  photoUrl?: string
  portraitTone?: string
  isPatient?: boolean
}): Promise<ApiPerson | null> {
  return api<ApiPerson>('/people', { method: 'POST', json: data })
}

export async function updatePerson(id: string, data: Record<string, unknown>): Promise<ApiPerson | null> {
  return api<ApiPerson>(`/people/${id}`, { method: 'PATCH', json: data })
}

export async function deletePerson(id: string): Promise<void | null> {
  await api(`/people/${id}`, { method: 'DELETE' })
}

export async function getVoiceNotesByPerson(personId: string): Promise<ApiVoiceNote[] | null> {
  return api<ApiVoiceNote[]>(`/voice-notes/person/${personId}`)
}

export async function createVoiceNote(data: {
  personId?: string
  memoryId?: string
  audioUrl?: string
  transcript?: string
  seconds: number
}): Promise<ApiVoiceNote | null> {
  return api<ApiVoiceNote>('/voice-notes', { method: 'POST', json: data })
}
