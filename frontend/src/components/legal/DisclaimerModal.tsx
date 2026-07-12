import { useEffect, useState, type ReactNode } from 'react'
import { Clock3, ShieldAlert } from 'lucide-react'
import { AdaptiveModal } from '@/components/ui/AdaptiveModal'
import { Button } from '@/components/ui/Button'

interface DisclaimerModalProps {
  open: boolean
  onAccept: () => void
  loading?: boolean
  title?: string
  disclaimer?: string
  children?: ReactNode
}

const defaultDisclaimer =
  'Questa piattaforma è un database chiuso ad uso esclusivo di Julian Rovera. Solo Julian Rovera può accedere: nessun familiare, amico, collaboratore, bot, intelligenza artificiale o terzo. Accedendo dichiari espressamente di essere Julian Rovera; ogni dichiarazione viene registrata con data, ora, IP e dispositivo. Non è un sistema di vendita, non gestisce denaro di terzi e i dati presenti sono fittizi o a solo scopo di test. Ogni accesso non autorizzato è vietato e tracciato.'

export function DisclaimerModal({
  open,
  onAccept,
  loading = false,
  title = 'Protocollo Ghost — uso personale',
  disclaimer = defaultDisclaimer,
  children,
}: DisclaimerModalProps) {
  const [accepted, setAccepted] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!open) return

    setAccepted(false)
    setNow(new Date())
    const interval = window.setInterval(() => setNow(new Date()), 1000)

    return () => window.clearInterval(interval)
  }, [open])

  const timestamp = new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(now)

  return (
    <AdaptiveModal
      description="Accettazione obbligatoria prima di proseguire."
      onOpenChange={() => undefined}
      open={open}
      title={title}
    >
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-950/55 via-black/50 to-amber-950/30 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.16),transparent_45%)]" />
          <div className="relative flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-400" />
            <p className="text-sm leading-relaxed text-white/90">{disclaimer}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
          <Clock3 className="h-4 w-4 text-primary/80" />
          <span>Registrazione dichiarazione di identità: {timestamp}</span>
        </div>

        {children}

        <label className="flex items-start gap-3 text-sm text-white/80">
          <input
            checked={accepted}
            className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
            onChange={(event) => setAccepted(event.target.checked)}
            type="checkbox"
          />
          <span>
            Confermo di essere Julian Rovera, unico titolare autorizzato, e accetto integralmente i
            termini e il disclaimer. Sono consapevole che questa dichiarazione di identità verrà
            registrata in modo permanente.
          </span>
        </label>

        <Button className="w-full" disabled={!accepted || loading} onClick={onAccept}>
          {loading ? 'Registrazione…' : 'Accetto e continuo'}
        </Button>
      </div>
    </AdaptiveModal>
  )
}
