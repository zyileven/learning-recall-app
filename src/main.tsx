import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply theme before first render to avoid flash of wrong theme
;(() => {
  try {
    const raw = localStorage.getItem('lr_settings')
    const theme = raw ? (JSON.parse(raw) as { theme?: string }).theme ?? 'system' : 'system'
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
  } catch { /* ignore */ }
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
