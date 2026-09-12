import { api } from '@/lib/api'

export interface ApiInsight {
  id: string
  patientId: string
  cognitiveDomain: string
  abilityEstimate: number
  baselineValue?: number
  currentValue?: number
  trend?: string
  explanation: string
  modelVersion?: string
  createdAt: string
}

export async function getInsights(patientId: string): Promise<ApiInsight[] | null> {
  return api<ApiInsight[]>(`/patients/${patientId}/insights`)
}

export async function getTrends(patientId: string): Promise<ApiInsight[] | null> {
  return api<ApiInsight[]>(`/patients/${patientId}/trends`)
}

export async function getAbility(patientId: string): Promise<ApiInsight[] | null> {
  return api<ApiInsight[]>(`/patients/${patientId}/ability`)
}
