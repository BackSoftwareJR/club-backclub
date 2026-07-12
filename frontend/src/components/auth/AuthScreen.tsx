import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AuthScreenProps {
  children: ReactNode
  screenKey?: string
}

export function AuthScreen({ children, screenKey = 'auth' }: AuthScreenProps) {
  return (
    <motion.div
      key={screenKey}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
