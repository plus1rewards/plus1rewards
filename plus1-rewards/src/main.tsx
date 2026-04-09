// plus1-rewards/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize performance monitoring in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  import('./utils/performanceMonitor').then(({ performanceMonitor }) => {
    // Monitor will automatically start tracking
    // Log summary after 5 seconds in development
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
  </StrictMode>,
)