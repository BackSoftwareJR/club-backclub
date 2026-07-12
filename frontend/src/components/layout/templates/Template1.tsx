import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { SideNav } from '@/components/layout/AdminToggle'
import { animatePageEnter } from '@/lib/gsap'
import { useTheme } from '@/hooks/useAuth'
import type { TemplateProps } from '@/components/layout/types'

export function Template1({ clubId, clubName, children }: TemplateProps) {
  const { themeConfig } = useTheme()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (mainRef.current) {
      animatePageEnter(mainRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen md:flex">
      <aside className="glass-panel fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 md:flex">
        <div className="border-b border-white/10 p-6">
          {themeConfig?.assets?.logo_url ? (
            <img
              alt={clubName}
              className="mb-3 h-10 w-auto object-contain"
              src={themeConfig.assets.logo_url}
            />
          ) : null}
          <p className="text-[10px] uppercase tracking-[0.35em] text-primary/70">Classic</p>
          <h1 className="mt-1 text-xl leading-tight">{clubName}</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SideNav clubId={clubId} />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/10 px-4 py-5 md:hidden"
          initial={{ opacity: 0, y: -12 }}
        >
          <p className="text-[10px] uppercase tracking-[0.35em] text-primary/70">Classic</p>
          <h1 className="mt-1 text-2xl">{clubName}</h1>
          <div className="mt-4">
            <SideNav clubId={clubId} />
          </div>
        </motion.header>

        <main ref={mainRef} className="flex-1 px-4 py-8 md:px-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
