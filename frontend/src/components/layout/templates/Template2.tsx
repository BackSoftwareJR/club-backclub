import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { AdminToggle, BottomTabs } from '@/components/layout/AdminToggle'
import { animatePageEnter } from '@/lib/gsap'
import { useTheme } from '@/hooks/useAuth'
import type { TemplateProps } from '@/components/layout/types'

export function Template2({ clubId, clubName, children }: TemplateProps) {
  const { themeConfig } = useTheme()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (mainRef.current) {
      animatePageEnter(mainRef.current)
    }
  }, [])

  return (
    <div className="relative min-h-screen pb-24">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <motion.div animate={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -16 }}>
            {themeConfig?.assets?.logo_url ? (
              <img
                alt={clubName}
                className="mb-1 h-8 w-auto object-contain"
                src={themeConfig.assets.logo_url}
              />
            ) : null}
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Modern Edge</p>
            <h1 className="text-xl sm:text-2xl">{clubName}</h1>
          </motion.div>
          <div className="shrink-0">
            <AdminToggle compact />
          </div>
        </div>
      </div>

      <main ref={mainRef} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <BottomTabs clubId={clubId} />
    </div>
  )
}
