import { api } from '@/lib/api'

export interface ApiSession {
  id: string
  patientId: string
  gameId: string
  startedAt: string
  endedAt?: string
  completionStatus?: string
  metadata?: Record<string, unknown>
}

export interface ApiAttempt {
  id: string
  sessionId: string
  questionId: string
  correct: boolean
  responseTimeMs?: number
  difficulty: string
  score?: number
  selectedAnswer?: string
  timestamp: string
}

export async function createSession(data: {
  patientId: string
  gameId: string
}): Promise<ApiSession | null> {
  return api<ApiSession>('/sessions', { method: 'POST', json: data })
}

export async function addAttempt(sessionId: string, data: {
  questionId: string
  correct: boolean
  responseTimeMs?: number
  difficulty: string
  score?: number
  selectedAnswer?: string
}): Promise<ApiAttempt | null> {
  return api<ApiAttempt>(`/sessions/${sessionId}/attempts`, { method: 'POST', json: data })
}

export async function endSession(sessionId: string, completionStatus: string): Promise<ApiSession | null> {
  return api<ApiSession>(`/sessions/${sessionId}/end`, {
    method: 'POST',
    json: { completionStatus },
  })
}

export async function getSessionsByPatient(patientId: string): Promise<ApiSession[] | null> {
  return api<ApiSession[]>(`/sessions/patients/${patientId}/sessions`)
}

export async function addMoodCheckin(patientId: string, mood: string, notes?: string): Promise<unknown | null> {
  return api(`/sessions/patients/${patientId}/mood`, {
    method: 'POST',
    json: { mood, notes },
  })
}
