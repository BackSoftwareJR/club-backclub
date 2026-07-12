import { useEffect, useState } from 'react'
import { DisclaimerModal } from '@/components/legal/DisclaimerModal'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const load = async () => {
      try {
        const response = await api.getLegalTerms()
        setTerms(response.data)
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
    <DisclaimerModal
      disclaimer={terms?.disclaimer}
      loading={loading || !terms}
      onAccept={() => void accept()}
      open={open}
      title={terms?.title ?? 'Termini di utilizzo'}
    >
      <div className="max-h-[30vh] space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-white/75">
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
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </DisclaimerModal>
  )
}
