import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LedgerTable } from '@/components/admin/LedgerTable'
import { TreasuryActions } from '@/components/admin/TreasuryActions'
import { TreasurySummary } from '@/components/admin/TreasurySummary'
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

  const loadTreasury = async () => {
    const data = await api.getTreasury(clubId)
    setTreasury(data)
  }

  useEffect(() => {
    const load = async () => {
      try {
        await loadTreasury()
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [clubId])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
