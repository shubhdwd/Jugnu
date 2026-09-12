import { api } from '@/lib/api'

export interface ApiHealthWorkerProfile {
  id: string
  userId: string
  area: string
  workerType: string
  phone?: string
  user?: { id: string; name: string; phone?: string; email?: string }
}

export interface ApiHealthWorkerPatient {
  id: string
  name: string
  age: number
  village?: string
  roomWard?: string
  portraitTone?: string
  caregiver?: { id: string; name: string; phone?: string }
  alerts?: { id: string; type: string; severity: string }[]
  _count?: { sessions: number; alerts: number }
}

export async function getHealthWorkerProfile(): Promise<ApiHealthWorkerProfile | null> {
  return api<ApiHealthWorkerProfile>('/health-workers/me')
}

export async function getHealthWorkerPatients(): Promise<{ patients: ApiHealthWorkerPatient[]; total: number } | null> {
  return api('/health-workers/patients')
}

export async function getPriorityList(): Promise<ApiHealthWorkerPatient[] | null> {
  return api<ApiHealthWorkerPatient[]>('/health-workers/priority-list')
}

export async function getVisitPlan(): Promise<unknown | null> {
  return api('/health-workers/visit-plan')
}
