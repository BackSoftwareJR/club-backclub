import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface TemplateProps {
  clubName: string
  children: ReactNode
}

export function Template1({ clubName, children }: TemplateProps) {
  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
        initial={{ opacity: 0, y: -12 }}
      >
        <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Classic</p>
        <h1 className="mt-2 text-4xl">{clubName}</h1>
      </motion.header>
      <main className="mx-auto max-w-5xl">{children}</main>
    </div>
  )
}
