import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BalanceCounter } from '@/components/wallet/BalanceCounter'
import { TopupRequestForm } from '@/components/wallet/TopupRequestForm'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { api } from '@/lib/api'
import { useClubId } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import type { TopupRequest } from '@/types'

export const Route = createFileRoute('/club/$clubId/_authenticated/wallet')({
  component: WalletPage,
})

function WalletPage() {
  const clubId = useClubId()
  const [balance, setBalance] = useState('0.00')
  const [requests, setRequests] = useState<TopupRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [wallet, topups] = await Promise.all([
          api.getWallet(clubId),
          api.listTopupRequests(clubId),
        ])
        setBalance(wallet.current_balance)
        setRequests(topups.data ?? [])
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <GlassPanel className="text-center">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/50">Your Balance</p>
        <BalanceCounter value={balance} />
      </GlassPanel>

      <TopupRequestForm />

      <GlassPanel>
        <h3 className="mb-4 text-lg">Your Top-up Requests</h3>
        {requests.length === 0 ? (
          <p className="text-white/50">No requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm"
              >
                <span>€{req.amount}</span>
                <span className="capitalize text-white/60">{req.status}</span>
                <span className="text-white/40">{formatDate(req.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  )
}
