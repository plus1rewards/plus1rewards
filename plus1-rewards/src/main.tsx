// plus1-rewards/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed silently
    })
  })
}

// Initialize performance monitoring in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  import('./utils/performanceMonitor').then(({ performanceMonitor }) => {
    setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        performanceMonitor.logSummary()
      }
    }, 5000)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <SpeedInsights />
  </StrictMode>,
)