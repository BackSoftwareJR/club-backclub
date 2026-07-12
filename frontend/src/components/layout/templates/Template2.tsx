import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface TemplateProps {
  clubName: string
  children: ReactNode
}

export function Template2({ clubName, children }: TemplateProps) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <motion.div animate={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -16 }}>
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">Modern Edge</p>
            <h1 className="text-2xl">{clubName}</h1>
          </motion.div>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
