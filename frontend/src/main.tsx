import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AppProvider } from '@/state/AppContext'
import { flushQueue } from '@/lib/api'
import './index.css'

// Register service worker for offline caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* sw registration failed */ })
  })
}

// Listen for sync messages from service worker
window.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_QUEUE') {
    flushQueue()
  }
})

// Flush pending sync queue on startup if online
if (navigator.onLine) {
  flushQueue()
}

const root = document.getElementById('root')
if (!root) throw new Error('Jugnu could not find its root element.')

createRoot(root).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
