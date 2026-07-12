import { Link } from '@tanstack/react-router'
import { Shield } from 'lucide-react'

export function LegalFooter() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 px-3 md:bottom-3 md:px-4">
      <div className="pointer-events-auto mx-auto flex max-w-3xl items-start gap-2 rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-[11px] leading-snug text-white/55 backdrop-blur-xl md:text-xs">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" />
        <p>
          Simulazione privata / gioco — nessuna vendita reale. Accesso solo NFC autorizzato. Email fittizie.
          Contenuti possibilmente AI.{' '}
          <Link className="text-primary/90 underline underline-offset-2" to="/legal">
            Termini completi
          </Link>
        </p>
      </div>
    </div>
  )
}
