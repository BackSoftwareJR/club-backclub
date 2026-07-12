import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { LedgerEntry } from '@/types'

interface LedgerTableProps {
  entries: LedgerEntry[]
}

const TYPE_LABELS: Record<LedgerEntry['transaction_type'], string> = {
  user_topup: 'User Top-up',
  admin_injection: 'Admin Injection',
  admin_expense: 'Admin Expense',
}

const TYPE_BADGE_CLASS: Record<LedgerEntry['transaction_type'], string> = {
  user_topup: 'bg-emerald-500/15 text-emerald-400',
  admin_injection: 'bg-sky-500/15 text-sky-400',
  admin_expense: 'bg-amber-500/15 text-amber-400',
}

export function LedgerTable({ entries }: LedgerTableProps) {
  if (entries.length === 0) {
    return <p className="text-center text-white/50">No ledger entries yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/50">
            <th className="pb-3 pr-4 font-medium">Type</th>
            <th className="pb-3 pr-4 font-medium">Amount</th>
            <th className="pb-3 pr-4 font-medium">Description</th>
            <th className="pb-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-white/5">
              <td className="py-3 pr-4">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                    TYPE_BADGE_CLASS[entry.transaction_type],
                  )}
                >
                  {TYPE_LABELS[entry.transaction_type]}
                </span>
              </td>
              <td
                className={`py-3 pr-4 font-medium ${parseFloat(entry.amount) < 0 ? 'text-red-400' : 'text-primary'}`}
              >
                {formatCurrency(entry.amount)}
              </td>
              <td className="py-3 pr-4 text-white/70">{entry.description}</td>
              <td className="py-3 text-white/50">{formatDate(entry.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
