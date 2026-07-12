import { useCallback, useEffect, useState } from 'react'
import { Radar, ShieldCheck } from 'lucide-react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { LuxurySpinner } from '@/components/ui/LuxurySpinner'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { SecurityRadarResponse } from '@/types'

interface SecurityRadarProps {
  clubId: number
}

export function SecurityRadar({ clubId }: SecurityRadarProps) {
  const [radar, setRadar] = useState<SecurityRadarResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setRadar(await api.getSecurityRadar(clubId))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile caricare il radar')
    }
  }, [clubId])

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => void load(), 15_000)
    return () => window.clearInterval(interval)
  }, [load])

  if (!radar && !error) {
    return (
      <div className="flex justify-center py-20">
        <LuxurySpinner label="Scanning security perimeter" />
      </div>
    )
  }

  if (!radar && error) {
    return (
      <GlassPanel className="border-red-500/20 p-5 text-sm text-red-300">
        Security Radar non disponibile: {error}
      </GlassPanel>
    )
  }

  return (
    <div className="space-y-5">
      <GlassPanel className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <Radar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl">Security Radar</h2>
            <p className="text-sm text-white/50">Monitoraggio intrusioni · aggiornamento ogni 15 secondi</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]">
          <span
            className={
              radar?.has_recent_intrusions
                ? 'h-3 w-3 animate-pulse rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.9)]'
                : 'h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.65)]'
            }
          />
          <span className={radar?.has_recent_intrusions ? 'text-red-300' : 'text-emerald-300'}>
            {radar?.has_recent_intrusions ? 'Allarme 24h' : 'Perimetro pulito'}
          </span>
        </div>
      </GlassPanel>

      {error ? <GlassPanel className="p-4 text-sm text-red-400">{error}</GlassPanel> : null}

      {radar?.data.length ? (
        <div className="space-y-3">
          {radar.data.map((log) => (
            <GlassPanel key={log.id} className="border-red-500/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-red-300">{log.violation_type}</p>
                  <p className="mt-1 font-mono text-xs text-white/55">{log.attempted_route}</p>
                </div>
                <time className="text-xs text-white/40">{formatDate(log.occurred_at)}</time>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/45">
                <span>IP: {log.ip_address ?? 'non disponibile'}</span>
                {log.nfc_uid ? <span>NFC: {log.nfc_uid}</span> : null}
              </div>
              {log.user_agent ? (
                <p className="mt-2 truncate text-[11px] text-white/30">{log.user_agent}</p>
              ) : null}
            </GlassPanel>
          ))}
        </div>
      ) : (
        <GlassPanel className="flex items-center gap-3 p-5 text-sm text-white/60">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          Nessun tentativo di intrusione registrato.
        </GlassPanel>
      )}
    </div>
  )
}
