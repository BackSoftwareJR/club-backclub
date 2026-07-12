import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { BalanceCounter } from '@/components/wallet/BalanceCounter'
import { TopupRequestForm } from '@/components/wallet/TopupRequestForm'
import { TopupStatusBadge } from '@/components/wallet/TopupStatusBadge'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { WalletSkeleton } from '@/components/ui/LuxurySkeleton'
import { api } from '@/lib/api'
import { useClubId } from '@/hooks/useAuth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/providers/ToastProvider'
import type { TopupRequest } from '@/types'

export const Route = createFileRoute('/club/$clubId/_authenticated/wallet')({
  component: WalletPage,
})

function WalletPage() {
  const clubId = useClubId()
  const { toast } = useToast()
  const [balance, setBalance] = useState('0.00')
  const [requests, setRequests] = useState<TopupRequest[]>([])
  const [loading, setLoading] = useState(true)

  const loadWallet = useCallback(async () => {
    const [wallet, topups] = await Promise.all([
      api.getWallet(clubId),
      api.listTopupRequests(clubId),
    ])
    setBalance(wallet.current_balance)
    setRequests(topups.data ?? [])
  }, [clubId])

  useEffect(() => {
    const load = async () => {
      try {
        await loadWallet()
      } catch (err) {
        toast({
          title: 'Failed to load wallet',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'error',
        })
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [clubId, loadWallet, toast])

  useEffect(() => {
    const refreshOnFocus = () => {
      if (document.visibilityState !== 'visible') return
      void loadWallet().catch(() => {
        /* silent refresh — initial load already surfaced errors */
      })
    }

    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnFocus)

    return () => {
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnFocus)
    }
  }, [loadWallet])

  if (loading) {
    return <WalletSkeleton />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <GlassPanel className="text-center">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/50">Your Balance</p>
        <BalanceCounter value={balance} />
      </GlassPanel>

      <TopupRequestForm onSuccess={loadWallet} />

      <GlassPanel>
        <h3 className="mb-4 text-lg">Your Top-up Requests</h3>
        {requests.length === 0 ? (
          <p className="text-white/50">No requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((req) => (
              <li
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm"
              >
                <span className="font-medium">{formatCurrency(req.amount)}</span>
                <TopupStatusBadge status={req.status} />
                <span className="text-white/40">{formatDate(req.created_at)}</span>
                {req.admin_note && req.status === 'rejected' ? (
                  <p className="w-full text-xs text-white/50">Note: {req.admin_note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  )
}
