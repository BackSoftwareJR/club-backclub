import { useEffect, useState } from 'react'
import { DisclaimerModal } from '@/components/legal/DisclaimerModal'
import { api } from '@/lib/api'
import type { LegalTermsDocument } from '@/types'

interface ClubCreateTermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (termsVersion: string) => void
  loading?: boolean
}

export function ClubCreateTermsModal({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: ClubCreateTermsModalProps) {
  const [terms, setTerms] = useState<LegalTermsDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    void api
      .getLegalTerms()
      .then((response) => setTerms(response.data))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Impossibile caricare i termini')
      })
  }, [open])

  return (
    <DisclaimerModal
      disclaimer={terms?.disclaimer}
      loading={!terms || loading}
      onAccept={() => terms && onConfirm(terms.version)}
      open={open}
      title="Disclaimer — nuovo modulo personale"
    >
      <div className="max-h-[40vh] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
        {terms?.sections.map((section) => (
          <section key={section.heading}>
            <h4 className="mb-1 font-medium text-white">{section.heading}</h4>
            <p>{section.body}</p>
          </section>
        ))}
        {error ? <p className="text-red-400">{error}. Chiudi e riprova.</p> : null}
      </div>
      <button
        className="text-xs text-white/45 underline underline-offset-4"
        onClick={() => onOpenChange(false)}
        type="button"
      >
        Annulla creazione
      </button>
    </DisclaimerModal>
  )
}
