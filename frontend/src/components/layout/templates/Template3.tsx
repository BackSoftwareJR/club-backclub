import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TopNav } from '@/components/layout/AdminToggle'
import { useCompactClubLayout } from '@/hooks/useCompactClubLayout'
import { animatePageEnter } from '@/lib/gsap'
import { useTheme } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { TemplateProps } from '@/components/layout/types'

export function Template3({ clubId, clubName, children }: TemplateProps) {
  const { themeConfig } = useTheme()
  const mainRef = useRef<HTMLDivElement>(null)
  const isCompact = useCompactClubLayout()

  useEffect(() => {
    if (mainRef.current) {
      animatePageEnter(mainRef.current)
    }
  }, [])

  const coverUrl = themeConfig?.assets?.cover_url

  return (
    <div className="relative min-h-screen">
      {coverUrl ? (
        <div
          className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      ) : null}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.12),transparent_40%)]" />

      <div
        ref={mainRef}
        className={cn(
          'relative min-h-screen overflow-y-auto',
          !isCompact && 'snap-y snap-proximity',
        )}
      >
        {isCompact ? (
          <section className="safe-top sticky top-0 z-20 border-b border-white/10 bg-background/85 px-4 py-3 backdrop-blur-xl md:px-10">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {themeConfig?.assets?.logo_url ? (
                  <img
                    alt={clubName}
                    className="h-9 w-auto shrink-0 object-contain"
                    src={themeConfig.assets.logo_url}
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate text-xs uppercase tracking-[0.25em] text-primary">{clubName}</p>
                </div>
              </div>
              <div className="hidden md:block">
                <TopNav clubId={clubId} />
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="safe-top relative flex min-h-[28vh] snap-start flex-col justify-end px-4 pb-8 pt-6 md:min-h-[50vh] md:px-10 md:pb-10 md:pt-16">
              <motion.header
                animate={{ opacity: 1 }}
                className="relative flex items-end justify-between gap-6 border-b border-white/10 pb-6"
                initial={{ opacity: 0 }}
              >
                <div>
                  {themeConfig?.assets?.logo_url ? (
                    <img
                      alt={clubName}
                      className="mb-4 h-12 w-auto object-contain"
                      src={themeConfig.assets.logo_url}
                    />
                  ) : null}
                  <p className="text-xs uppercase tracking-[0.4em] text-primary">Velvet</p>
                  <h1 className="text-4xl md:text-6xl">{clubName}</h1>
                </div>
                <div className="hidden h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent md:block" />
              </motion.header>
            </section>

            <section className="snap-start px-4 pb-16 md:px-10">
              <div className="sticky top-0 z-20 -mx-4 mb-6 hidden border-b border-white/10 bg-background/80 px-4 py-4 backdrop-blur-xl md:-mx-10 md:mb-8 md:block md:px-10">
                <TopNav clubId={clubId} />
              </div>
              <main className="mx-auto max-w-6xl">{children}</main>
            </section>
          </>
        )}

        {isCompact ? (
          <section className="px-4 pb-16 pt-6 md:px-10">
            <main className="mx-auto max-w-6xl">{children}</main>
          </section>
        ) : null}
      </div>
    </div>
  )
}
