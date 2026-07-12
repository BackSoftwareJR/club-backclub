import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { api } from '@/lib/api'
import { useToast } from '@/providers/ToastProvider'
import { useClubId } from '@/hooks/useAuth'

export function TopupRequestForm() {
  const clubId = useClubId()
  const { toast } = useToast()
  const [amount, setAmount] = useState('50.00')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      await api.createTopupRequest(clubId, amount)
      toast({
        title: 'Top-up requested',
        description: 'Your request is pending admin approval.',
        variant: 'success',
      })
    } catch (err) {
      toast({
        title: 'Request failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassPanel>
      <h3 className="mb-4 text-lg font-medium">Request Top-up</h3>
      <div className="flex gap-3">
        <input
          className="glass-panel h-11 flex-1 rounded-xl border-white/10 bg-black/30 px-4 text-white outline-none focus:ring-2 focus:ring-primary/40"
          inputMode="decimal"
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          type="text"
          value={amount}
        />
        <Button disabled={loading} onClick={() => void submit()}>
          {loading ? 'Sending…' : 'Submit'}
        </Button>
      </div>
    </GlassPanel>
  )
}
