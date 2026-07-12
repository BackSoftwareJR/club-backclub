import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { PinEntry } from '@/components/auth/PinEntry'
import { PinSetup } from '@/components/auth/PinSetup'
import { LuxurySpinner } from '@/components/ui/LuxurySpinner'
import { api } from '@/lib/api'
import { bootstrapEntryContext } from '@/providers/AuthProvider'
import { useTheme } from '@/hooks/useAuth'
import type { EntryResponse } from '@/types'

export const Route = createFileRoute('/entry/$clubId/$nfcUid')({
  component: EntryPage,
})

function EntryPage() {
  const { clubId, nfcUid } = Route.useParams()
  const navigate = useNavigate()
  const { applyTheme } = useTheme()
  const [entry, setEntry] = useState<EntryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setError(null)
      setEntry(null)

      try {
        const data = await api.entry(Number(clubId), nfcUid)
        setEntry(data)
        applyTheme(data.theme_config)
        bootstrapEntryContext(data.club_id, data.nfc_uid, data.club_name, data.theme_config)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Entry failed')
      }
    }
    void load()
  }, [clubId, nfcUid, applyTheme])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <AuthScreen screenKey="entry-error">
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel max-w-md p-8 text-center text-red-400"
            initial={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        </AuthScreen>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LuxurySpinner label="Recognizing card" />
      </div>
    )
  }

  if (entry.requires_pin_setup) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <PinSetup clubId={entry.club_id} clubName={entry.club_name} nfcUid={entry.nfc_uid} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <PinEntry
        clubId={entry.club_id}
        clubName={entry.club_name}
        nfcUid={entry.nfc_uid}
        onSuccess={() =>
          void navigate({
            to: '/club/$clubId',
            params: { clubId: String(entry.club_id) },
          })
        }
      />
    </div>
  )
}
