import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { AdaptiveModal } from '@/components/ui/AdaptiveModal'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import type { LegalTermsDocument } from '@/types'

interface TermsAcceptanceModalProps {
  open: boolean
  clubId: number
  nfcUid: string
  onAccepted: () => void
}

export function TermsAcceptanceModal({ open, clubId, nfcUid, onAccepted }: TermsAcceptanceModalProps) {
  const [terms, setTerms] = useState<LegalTermsDocument | null>(null)
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const load = async () => {
      try {
        const response = await api.getLegalTerms()
        setTerms(response.data)
        setChecked(false)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load terms')
      }
    }

    void load()
  }, [open])

  const accept = async () => {
    if (!terms) return

    setLoading(true)
    setError(null)
    try {
      await api.acceptLegalTerms({
        club_id: clubId,
        nfc_uid: nfcUid,
        terms_version: terms.version,
      })
      onAccepted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Acceptance failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdaptiveModal
      description="Simulazione privata — obbligatorio prima di continuare."
      onOpenChange={() => undefined}
      open={open}
      title={terms?.title ?? 'Termini di utilizzo'}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100/90">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            {terms?.summary ??
              'Piattaforma di simulazione personale. Nessuna vendita reale. Accesso solo tramite carta NFC autorizzata.'}
          </p>
        </div>

        <div className="max-h-[42vh] space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-white/75">
          {terms?.sections.map((section) => (
            <section key={section.heading}>
              <h4 className="mb-1 font-medium text-white">{section.heading}</h4>
              <p>{section.body}</p>
            </section>
          ))}
          {terms ? (
            <p className="text-xs text-white/40">
              Versione {terms.version} · in vigore dal {terms.effective_date}
            </p>
          ) : null}
        </div>

        <label className="flex items-start gap-3 text-sm text-white/80">
          <input
            checked={checked}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40 accent-[var(--color-primary)]"
            onChange={(event) => setChecked(event.target.checked)}
            type="checkbox"
          />
          <span>
            Dichiaro di aver letto e accettato i termini. Comprendo che si tratta di una simulazione privata,
            non commerciale, senza vendite reali, con email fittizie e contenuti non necessariamente veritieri.
          </span>
        </label>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button className="w-full" disabled={!checked || loading || !terms} onClick={() => void accept()}>
          {loading ? 'Registrazione…' : 'Accetto e continuo'}
        </Button>
      </div>
    </AdaptiveModal>
  )
}
