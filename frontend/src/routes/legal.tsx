import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { LuxurySpinner } from '@/components/ui/LuxurySpinner'
import { api } from '@/lib/api'
import type { LegalTermsDocument } from '@/types'

export const Route = createFileRoute('/legal')({
  component: LegalPage,
})

function LegalPage() {
  const [terms, setTerms] = useState<LegalTermsDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.getLegalTerms()
        setTerms(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load terms')
      }
    }
    void load()
  }, [])

  if (error) {
    return <GlassPanel className="mx-auto max-w-3xl p-6 text-red-400">{error}</GlassPanel>
  }

  if (!terms) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LuxurySpinner label="Loading legal terms" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <GlassPanel className="space-y-6 p-6 md:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80">Compliance</p>
          <h1 className="mt-2 text-3xl">{terms.title}</h1>
          <p className="mt-2 text-sm text-white/50">
            Versione {terms.version} · in vigore dal {terms.effective_date}
          </p>
          <p className="mt-4 text-sm text-white/70">{terms.summary}</p>
        </div>

        <div className="space-y-5 text-sm leading-relaxed text-white/75">
          {terms.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-2 text-base font-medium text-white">{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </GlassPanel>
    </div>
  )
}
