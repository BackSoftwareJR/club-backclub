import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api'
import { useClubId } from '@/hooks/useAuth'
import { getSession } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/providers/ToastProvider'
import type { TopupRequest } from '@/types'

export const Route = createFileRoute('/club/$clubId/_authenticated/admin/topups')({
  beforeLoad: () => {
    const session = getSession()
    if (!session?.is_club_owner) {
      throw redirect({
        to: '/club/$clubId',
        params: { clubId: String(session?.club.id ?? 1) },
      })
    }
  },
  component: AdminTopupsPage,
})

function AdminTopupsPage() {
  const clubId = useClubId()
  const { toast } = useToast()
  const [requests, setRequests] = useState<TopupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = async () => {
    const response = await api.listAdminTopupRequests(clubId, 'pending')
    setRequests(response.data ?? [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        await load()
      } finally {
        setLoading(false)
      }
    }
    void init()
  }, [clubId])

  const approve = async (id: number) => {
    setActionLoading(true)
    try {
      await api.approveTopup(clubId, id)
      toast({ title: 'Top-up approved', variant: 'success' })
      await load()
    } catch (err) {
      toast({
        title: 'Approval failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const reject = async () => {
    if (!rejectId) return
    setActionLoading(true)
    try {
      await api.rejectTopup(clubId, rejectId, rejectNote || 'Rejected by admin')
      toast({ title: 'Top-up rejected', variant: 'success' })
      setRejectId(null)
      setRejectNote('')
      await load()
    } catch (err) {
      toast({
        title: 'Rejection failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Pending Top-ups</h2>

      {requests.length === 0 ? (
        <GlassPanel className="text-center text-white/50">No pending requests.</GlassPanel>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <GlassPanel key={req.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="text-lg font-medium">€{req.amount}</p>
                <p className="text-sm text-white/50">{formatDate(req.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <Button disabled={actionLoading} onClick={() => void approve(req.id)}>
                  Approve
                </Button>
                <Button
                  disabled={actionLoading}
                  onClick={() => setRejectId(req.id)}
                  variant="destructive"
                >
                  Reject
                </Button>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <Modal
        onOpenChange={(open) => {
          if (!open) setRejectId(null)
        }}
        open={rejectId !== null}
        title="Reject Top-up"
        description="Optionally provide a note for the member."
      >
        <textarea
          className="glass-panel mb-4 min-h-24 w-full rounded-xl border-white/10 bg-black/30 p-3 text-white outline-none"
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Admin note (optional)"
          value={rejectNote}
        />
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => setRejectId(null)} variant="ghost">
            Cancel
          </Button>
          <Button className="flex-1" disabled={actionLoading} onClick={() => void reject()} variant="destructive">
            Confirm Reject
          </Button>
        </div>
      </Modal>
    </div>
  )
}
