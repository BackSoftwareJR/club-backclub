import { useRouterState } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

const pageVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const reducedMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        animate="animate"
        exit="exit"
        initial="initial"
        transition={
          reducedMotion
            ? { duration: 0.01 }
            : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
        }
        variants={
          reducedMotion
            ? {
                initial: { opacity: 1, y: 0, filter: 'blur(0px)' },
                animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
                exit: { opacity: 1, y: 0, filter: 'blur(0px)' },
              }
            : pageVariants
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
