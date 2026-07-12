import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'

interface ClubContextValue {
  clubId: number
  clubName: string
}

const ClubContext = createContext<ClubContextValue | null>(null)

export function ClubProvider({ children }: { children: ReactNode }) {
  const { session } = useAuthContext()

  const value = useMemo(() => {
    if (!session) return null
    return {
      clubId: session.club.id,
      clubName: session.club.name,
    }
  }, [session])

  if (!value) return null

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>
}

export function useClubContext(): ClubContextValue {
  const ctx = useContext(ClubContext)
  if (!ctx) {
    throw new Error('useClubContext must be used within ClubProvider')
  }
  return ctx
}

export function useClubId(): number {
  return useClubContext().clubId
}
