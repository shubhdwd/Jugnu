import { api } from '@/lib/api'

export interface ApiReminder {
  id: string
  patientId: string
  type: string
  title: string
  message: string
  time: string
  scheduledAt: string
  repeatRule: string
  priority: string
  active: boolean
  completed: boolean
  note?: string
  assignedToUserId?: string
  createdAt: string
  updatedAt: string
}

export async function getReminders(patientId: string): Promise<ApiReminder[] | null> {
  return api<ApiReminder[]>(`/patients/${patientId}/reminders`)
}

export async function createReminder(patientId: string, data: {
  type: string
  title: string
  message: string
  scheduledAt: string
  repeatRule?: string
  priority?: string
  note?: string
  assignedToUserId?: string
}): Promise<ApiReminder | null> {
  return api<ApiReminder>(`/patients/${patientId}/reminders`, { method: 'POST', json: data })
}

export async function updateReminder(id: string, data: Record<string, unknown>): Promise<ApiReminder | null> {
  return api<ApiReminder>(`/reminders/${id}`, { method: 'PATCH', json: data })
}

export async function deleteReminder(id: string): Promise<void | null> {
  await api(`/reminders/${id}`, { method: 'DELETE' })
}
