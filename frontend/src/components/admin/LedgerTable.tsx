import { formatCurrency, formatDate } from '@/lib/utils'
import type { LedgerEntry } from '@/types'

interface LedgerTableProps {
  entries: LedgerEntry[]
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
              <td className="py-3 pr-4 capitalize">{entry.transaction_type.replace('_', ' ')}</td>
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
