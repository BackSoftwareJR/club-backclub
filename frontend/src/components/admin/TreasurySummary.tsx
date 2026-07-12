import { GlassPanel } from '@/components/ui/GlassPanel'
import { formatCurrency } from '@/lib/utils'
import type { TreasuryResponse } from '@/types'

interface TreasurySummaryProps {
  treasury: TreasuryResponse
}

export function TreasurySummary({ treasury }: TreasurySummaryProps) {
  return (
    <GlassPanel>
      <p className="text-sm uppercase tracking-[0.2em] text-white/50">Cash Flow Total</p>
      <p className="mt-2 text-4xl font-semibold text-primary">
        {formatCurrency(treasury.cash_flow_total)}
      </p>
      <p className="mt-2 text-sm text-white/60">
        {treasury.ledger.length} ledger entries
      </p>
    </GlassPanel>
  )
}
