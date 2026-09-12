import { api } from '@/lib/api'

export interface ApiFamilyMember {
  id: string
  patientId: string
  userId: string
  relationship: string
  accessLevel: string
  createdAt: string
  user?: { id: string; name: string; phone?: string; email?: string }
}

export async function getFamilyMembers(patientId: string): Promise<ApiFamilyMember[] | null> {
  return api<ApiFamilyMember[]>(`/family/members/${patientId}`)
}

export async function addFamilyMember(data: {
  patientId: string
  userId: string
  relationship: string
  accessLevel?: string
}): Promise<ApiFamilyMember | null> {
  return api<ApiFamilyMember>('/family', { method: 'POST', json: data })
}

export async function removeFamilyMember(id: string): Promise<void | null> {
  await api(`/family/member/${id}`, { method: 'DELETE' })
}
