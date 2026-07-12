import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
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
  const { session, isLocked } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLocked) {
      void navigate({ to: '/locked' })
    }
  }, [isLocked, navigate])

  if (!session || isLocked) return null

  return (
    <ClubProvider>
      <LayoutResolver clubId={Number(clubId)} clubName={session.club.name}>
        <Outlet />
      </LayoutResolver>
    </ClubProvider>
  )
}
