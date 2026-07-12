import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/storage'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const session = getSession()
    if (session) {
      throw redirect({
        to: '/club/$clubId',
        params: { clubId: String(session.club.id) },
      })
    }
  },
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel max-w-lg p-8 text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary">Club CRM</p>
        <h1 className="mb-4 text-3xl">Scan your NFC card to enter</h1>
        <p className="text-white/60">
          Open your club entry URL:{' '}
          <code className="text-primary">/entry/:clubId/:nfcUid</code>
        </p>
      </div>
    </div>
  )
}
