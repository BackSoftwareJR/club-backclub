import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
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

  if (!session) return null

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <PinEntry
        clubId={session.club.id}
        clubName={session.club.name}
        mode="unlock"
        nfcUid={entry?.nfcUid ?? session.nfc_uid}
        onSuccess={() => {
          setLocked(false)
          void navigate({
            to: '/club/$clubId',
            params: { clubId: String(session.club.id) },
          })
        }}
      />
    </div>
  )
}
