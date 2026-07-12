import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { PinEntry } from '@/components/auth/PinEntry'
import { LayoutResolver } from '@/components/layout/LayoutResolver'
import { ClubProvider } from '@/providers/ClubProvider'
import { useAuth } from '@/hooks/useAuth'
import { getEntryContext, getSession } from '@/lib/storage'

export const Route = createFileRoute('/club/$clubId/_authenticated')({
  beforeLoad: ({ params }) => {
    const session = getSession()
    if (!session) {
      const entry = getEntryContext()
      if (entry) {
        throw redirect({
          to: '/entry/$clubId/$nfcUid',
          params: { clubId: String(entry.clubId), nfcUid: entry.nfcUid },
        })
      }
      throw redirect({ to: '/' })
    }
    if (String(session.club.id) !== params.clubId) {
      throw redirect({
        to: '/club/$clubId',
        params: { clubId: String(session.club.id) },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { clubId } = Route.useParams()
  const { session, isLocked, setLocked } = useAuth()
  const navigate = useNavigate()
  const entry = getEntryContext()

  useEffect(() => {
    if (isLocked) {
      void navigate({ to: '/locked' })
    }
  }, [isLocked, navigate])

  if (!session) return null

  if (isLocked) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <PinEntry
          clubId={session.club.id}
          clubName={session.club.name}
          mode="unlock"
          nfcUid={entry?.nfcUid ?? session.nfc_uid}
          onSuccess={() => setLocked(false)}
        />
      </div>
    )
  }

  return (
    <ClubProvider>
      <LayoutResolver clubId={Number(clubId)} clubName={session.club.name}>
        <Outlet />
      </LayoutResolver>
    </ClubProvider>
  )
}
