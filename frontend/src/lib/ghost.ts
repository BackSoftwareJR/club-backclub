import { clearEntryContext, clearSession } from '@/lib/storage'

const GOOGLE_URL = 'https://www.google.com'
const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
let redirectInProgress = false

interface GhostRedirectOptions {
  reportDirectAccess?: boolean
  attemptedRoute?: string
}

function reportDirectAccess(attemptedRoute: string): void {
  const body = new URLSearchParams({ attempted_route: attemptedRoute })
  try {
    navigator.sendBeacon(`${apiBaseUrl}/security/direct-access`, body)
  } catch {
    // Redirection must never be blocked by forensic transport failure.
  }
}

export function ghostRedirect(options: GhostRedirectOptions = {}): void {
  if (redirectInProgress) return
  redirectInProgress = true

  const attemptedRoute =
    options.attemptedRoute ?? `${window.location.pathname}${window.location.search}`

  document.documentElement.style.background = '#000'
  document.body.style.background = '#000'
  const blackout = document.createElement('div')
  blackout.setAttribute('aria-hidden', 'true')
  Object.assign(blackout.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',
    background: '#000',
  })
  document.body.appendChild(blackout)
  clearSession()
  clearEntryContext()

  if (options.reportDirectAccess) {
    reportDirectAccess(attemptedRoute)
  }

  window.location.replace(GOOGLE_URL)
}
