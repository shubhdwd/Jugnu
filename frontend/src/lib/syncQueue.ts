/**
 * Offline-first sync queue.
 * 
 * All write operations (POST, PATCH, DELETE) are queued in localStorage
 * when the device is offline. When connectivity returns, the queue is
 * flushed to the backend/Supabase in order.
 */

const QUEUE_KEY = 'jugnu.sync.queue'

export interface SyncEntry {
  id: string
  method: 'POST' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  createdAt: number
  retries: number
}

const MAX_RETRIES = 5

export function getQueue(): SyncEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(queue: SyncEntry[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch { /* quota exceeded — queue will be lost but app keeps working */ }
}

export function enqueue(entry: Omit<SyncEntry, 'id' | 'createdAt' | 'retries'>): SyncEntry {
  const item: SyncEntry = {
    ...entry,
    id: `sq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    retries: 0,
  }
  const queue = getQueue()
  queue.push(item)
  saveQueue(queue)
  return item
}

export function removeEntry(id: string) {
  const queue = getQueue().filter((e) => e.id !== id)
  saveQueue(queue)
}

export function incrementRetry(id: string): boolean {
  const queue = getQueue()
  const entry = queue.find((e) => e.id === id)
  if (!entry) return false
  entry.retries += 1
  if (entry.retries >= MAX_RETRIES) {
    saveQueue(queue.filter((e) => e.id !== id))
    return false // max retries reached, drop it
  }
  saveQueue(queue)
  return true
}

export function clearQueue() {
  saveQueue([])
}

export function queueLength(): number {
  return getQueue().length
}
