import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from '@tanstack/react-router'
import { api } from '@/lib/api'
import {
  clearSession,
  clearToken,
  getSession,
  setEntryContext,
  setSession,
  type EntryContext,
} from '@/lib/storage'
import { applyThemeToDocument } from '@/providers/ThemeProvider'
import type { AuthResponse, AuthSession, ThemeConfig } from '@/types'
import { useIdleTimeout } from '@/hooks/useIdleTimeout'

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  isLocked: boolean
  isClubOwner: boolean
  clubId: number | null
  login: (response: AuthResponse, nfcUid: string) => void
  logout: () => void
  unlock: (pin: string) => Promise<void>
  setLocked: (locked: boolean) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const IDLE_TIMEOUT_MS = 3 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [session, setSessionState] = useState<AuthSession | null>(() => getSession())
  const [isLocked, setIsLocked] = useState(false)

  const login = useCallback((response: AuthResponse, nfcUid: string) => {
    const authSession: AuthSession = { ...response, nfc_uid: nfcUid }
    setSession(authSession)
    setSessionState(authSession)
    applyThemeToDocument(response.club.theme_config)
    setIsLocked(false)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSessionState(null)
    setIsLocked(false)
    void navigate({ to: '/' })
  }, [navigate])

  const handleIdle = useCallback(() => {
    if (session) {
      clearToken()
      setIsLocked(true)
      void navigate({ to: '/locked' })
    }
  }, [session, navigate])

  useIdleTimeout(handleIdle, IDLE_TIMEOUT_MS, !!session && !isLocked)

  const unlock = useCallback(
    async (pin: string) => {
      if (!session) throw new Error('No active session')
      const response = await api.login({
        club_id: session.club.id,
        nfc_uid: session.nfc_uid,
        pin,
      })
      login(response, session.nfc_uid)
    },
    [session, login],
  )

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: !!session,
      isLocked,
      isClubOwner: session?.is_club_owner ?? false,
      clubId: session?.club.id ?? null,
      login,
      logout,
      unlock,
      setLocked: setIsLocked,
    }),
    [session, isLocked, login, logout, unlock],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return ctx
}

export function bootstrapEntryContext(
  clubId: number,
  nfcUid: string,
  clubName: string,
  themeConfig: ThemeConfig,
): EntryContext {
  const ctx = { clubId, nfcUid, clubName }
  setEntryContext(ctx)
  applyThemeToDocument(themeConfig)
  return ctx
}

export function useAuthBootstrap(): void {
  const session = getSession()
  useEffect(() => {
    if (session?.club.theme_config) {
      applyThemeToDocument(session.club.theme_config)
    }
  }, [session])
}
