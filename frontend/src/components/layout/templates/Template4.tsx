import { useEffect, useRef } from 'react'
import { MinimalNav } from '@/components/layout/AdminToggle'
import { animatePageEnter } from '@/lib/gsap'
import { useTheme } from '@/hooks/useAuth'
import type { TemplateProps } from '@/components/layout/types'

export function Template4({ clubId, clubName, children }: TemplateProps) {
  const { themeConfig } = useTheme()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (mainRef.current) {
      animatePageEnter(mainRef.current)
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10 md:px-8">
      <header className="mb-10 w-full max-w-2xl text-center">
        {themeConfig?.assets?.logo_url ? (
          <img
            alt={clubName}
            className="mx-auto mb-4 h-10 w-auto object-contain"
            src={themeConfig.assets.logo_url}
          />
        ) : null}
        <p className="text-[10px] uppercase tracking-[0.5em] text-white/40">Minimal</p>
        <h1 className="mt-2 text-3xl font-light tracking-wide">{clubName}</h1>
        <div className="mx-auto mt-6 h-px w-16 bg-primary/40" />
        <div className="mt-8">
          <MinimalNav clubId={clubId} />
        </div>
      </header>

      <main ref={mainRef} className="w-full max-w-2xl flex-1">
        {children}
      </main>
    </div>
  )
}
