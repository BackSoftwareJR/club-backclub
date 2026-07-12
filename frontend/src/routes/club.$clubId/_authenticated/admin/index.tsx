import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { LedgerTable } from '@/components/admin/LedgerTable'
import { TreasuryActions } from '@/components/admin/TreasuryActions'
import { TreasurySummary } from '@/components/admin/TreasurySummary'
import { LuxurySpinner } from '@/components/ui/LuxurySpinner'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { api } from '@/lib/api'
import { useClubId } from '@/hooks/useAuth'
import { getSession } from '@/lib/storage'
import type { TreasuryResponse } from '@/types'

export const Route = createFileRoute('/club/$clubId/_authenticated/admin/')({
  beforeLoad: () => {
    const session = getSession()
    if (!session?.is_club_owner) {
      throw redirect({
        to: '/club/$clubId',
        params: { clubId: String(session?.club.id ?? 1) },
      })
    }
  },
  component: AdminTreasuryPage,
})

function AdminTreasuryPage() {
  const clubId = useClubId()
  const [treasury, setTreasury] = useState<TreasuryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTreasury = useCallback(async () => {
    setError(null)
    const data = await api.getTreasury(clubId)
    setTreasury(data)
  }, [clubId])

  useEffect(() => {
    const load = async () => {
      try {
        await loadTreasury()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load treasury')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [loadTreasury])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LuxurySpinner label="Loading treasury" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 py-20 text-center">
        <p className="text-red-400">{error}</p>
        <Button
          onClick={() => {
            setLoading(true)
            void loadTreasury()
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Failed to load treasury')
              })
              .finally(() => setLoading(false))
          }}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!treasury) return null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Treasury</h2>
      <TreasurySummary treasury={treasury} />
      <TreasuryActions clubId={clubId} onSuccess={loadTreasury} />
      <GlassPanel>
        <h3 className="mb-4 text-lg">Ledger</h3>
        <LedgerTable entries={treasury.ledger} />
      </GlassPanel>
    </div>
  )
}
