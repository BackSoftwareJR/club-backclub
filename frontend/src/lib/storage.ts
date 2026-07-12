import type { AuthSession, ThemeConfig } from '@/types'

const TOKEN_KEY = 'club_crm_token'
const SESSION_KEY = 'club_crm_session'
const ENTRY_KEY = 'club_crm_entry'

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function getSession(): AuthSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function setSession(session: AuthSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  setToken(session.token)
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
  clearToken()
}

export function setSessionTheme(themeConfig: ThemeConfig): void {
  const session = getSession()
  if (!session) return

  setSession({
    ...session,
    club: {
      ...session.club,
      theme_config: themeConfig,
    },
  })
}

export interface EntryContext {
  clubId: number
  nfcUid: string
  clubName: string
}

export function getEntryContext(): EntryContext | null {
  const raw = sessionStorage.getItem(ENTRY_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as EntryContext
  } catch {
    return null
  }
}

export function setEntryContext(ctx: EntryContext): void {
  sessionStorage.setItem(ENTRY_KEY, JSON.stringify(ctx))
}

export function clearEntryContext(): void {
  sessionStorage.removeItem(ENTRY_KEY)
}
