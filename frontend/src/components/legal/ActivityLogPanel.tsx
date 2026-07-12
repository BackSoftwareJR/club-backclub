import { useEffect, useState } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { LuxurySpinner } from '@/components/ui/LuxurySpinner'
import { formatDate } from '@/lib/utils'
import { api } from '@/lib/api'
import type { ActivityLogEntry } from '@/types'

interface ActivityLogPanelProps {
  clubId: number
}

export function ActivityLogPanel({ clubId }: ActivityLogPanelProps) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.listActivityLogs(clubId)
        setLogs(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activity logs')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [clubId])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LuxurySpinner label="Loading audit log" />
      </div>
    )
  }

  if (error) {
    return <GlassPanel className="p-4 text-sm text-red-400">{error}</GlassPanel>
  }

  return (
    <GlassPanel className="space-y-4 p-4">
      <div>
        <h3 className="text-lg">Audit log</h3>
        <p className="text-sm text-white/50">Accessi NFC, login, movimenti e azioni amministrative.</p>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-white/45">No events recorded yet.</p>
      ) : (
        <ul className="max-h-[420px] space-y-2 overflow-y-auto">
          {logs.map((log) => (
            <li key={log.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-white/85">{log.event_type}</span>
                <span className="text-white/40">{formatDate(log.occurred_at)}</span>
              </div>
              <p className="mt-1 text-white/45">
                {log.status}
                {log.nfc_uid ? ` · ${log.nfc_uid}` : ''}
                {log.ip_address ? ` · ${log.ip_address}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  )
}
