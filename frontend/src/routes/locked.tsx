import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { api } from '@/lib/api'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { PinEntry } from '@/components/auth/PinEntry'
import { getEntryContext, getSession } from '@/lib/storage'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/locked')({
  beforeLoad: () => {
    const session = getSession()
    if (!session) {
      throw redirect({ to: '/' })
    }
  },
  component: LockedPage,
})

function LockedPage() {
  const session = getSession()
  const entry = getEntryContext()
  const { setLocked } = useAuth()
  const navigate = useNavigate()
  const nfcUid = session ? entry?.nfcUid ?? session.nfc_uid : ''

  useEffect(() => {
    if (!session || !nfcUid) return

    void api
      .entry(session.club.id, nfcUid)
      .then((response) => {
        if (response.requires_terms_acceptance) {
          window.location.assign(`/entry/${session.club.id}/${nfcUid}`)
        }
      })
      .catch(() => undefined)
  }, [session, nfcUid])

  if (!session) return null

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <AuthScreen screenKey="locked">
        <PinEntry
          clubId={session.club.id}
          clubName={session.club.name}
          mode="unlock"
          nfcUid={nfcUid}
          onSuccess={() => {
            setLocked(false)
            void navigate({
              to: '/club/$clubId',
              params: { clubId: String(session.club.id) },
            })
          }}
        />
      </AuthScreen>
    </div>
  )
}
