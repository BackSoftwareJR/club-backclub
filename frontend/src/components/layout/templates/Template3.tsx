import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface TemplateProps {
  clubName: string
  children: ReactNode
}

export function Template3({ clubName, children }: TemplateProps) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 md:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.12),transparent_40%)]" />
      <motion.header
        animate={{ opacity: 1 }}
        className="relative mb-10 flex items-end justify-between gap-6 border-b border-white/10 pb-6"
        initial={{ opacity: 0 }}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Velvet</p>
          <h1 className="text-4xl md:text-5xl">{clubName}</h1>
        </div>
        <div className="hidden h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent md:block" />
      </motion.header>
      <main className="relative mx-auto max-w-6xl">{children}</main>
    </div>
  )
}
