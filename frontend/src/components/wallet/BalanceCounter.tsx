import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface BalanceCounterProps {
  value: string
  className?: string
}

export function BalanceCounter({ value, className }: BalanceCounterProps) {
  const target = parseFloat(value) || 0
  const [display, setDisplay] = useState(target)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const start = display
    const diff = target - start
    const duration = 800
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(start + diff * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return (
    <motion.span
      className={cn('text-gradient-gold text-5xl font-semibold tracking-tight', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      €{display.toFixed(2)}
    </motion.span>
  )
}
