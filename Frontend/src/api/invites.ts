import { api } from '@/lib/api'

export interface ApiInvite {
  id: string
  patientId: string
  name: string
  contact: string
  layer: number
  status: string
  sentAt: string
  createdAt: string
}

export async function getInvites(patientId: string): Promise<ApiInvite[] | null> {
  return api<ApiInvite[]>(`/invites/${patientId}`)
}

export async function createInvite(data: {
  patientId: string
  name: string
  contact: string
  layer: number
}): Promise<ApiInvite | null> {
  return api<ApiInvite>('/invites', { method: 'POST', json: data })
}

export async function updateInviteStatus(id: string, status: string): Promise<ApiInvite | null> {
  return api<ApiInvite>(`/invites/${id}`, { method: 'PATCH', json: { status } })
}

export async function deleteInvite(id: string): Promise<void | null> {
  await api(`/invites/${id}`, { method: 'DELETE' })
}
