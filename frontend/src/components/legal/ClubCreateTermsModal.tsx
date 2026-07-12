import { useEffect, useState } from 'react'
import { AdaptiveModal } from '@/components/ui/AdaptiveModal'
import { Button } from '@/components/ui/Button'
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
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!open) return
    void api.getLegalTerms().then((response) => {
      setTerms(response.data)
      setChecked(false)
    })
  }, [open])

  return (
    <AdaptiveModal
      description="Conferma i termini prima di creare un nuovo club simulato."
      onOpenChange={onOpenChange}
      open={open}
      title="Termini — nuovo club"
    >
      <div className="max-h-[40vh] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
        {terms?.sections.map((section) => (
          <section key={section.heading}>
            <h4 className="mb-1 font-medium text-white">{section.heading}</h4>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
      <label className="mt-4 flex items-start gap-3 text-sm text-white/80">
        <input
          checked={checked}
          className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
          onChange={(event) => setChecked(event.target.checked)}
          type="checkbox"
        />
        <span>Accetto i termini per la creazione di un club di simulazione privata.</span>
      </label>
      <Button
        className="mt-4 w-full"
        disabled={!checked || !terms || loading}
        onClick={() => terms && onConfirm(terms.version)}
      >
        {loading ? 'Creazione…' : 'Accetto e creo club'}
      </Button>
    </AdaptiveModal>
  )
}
