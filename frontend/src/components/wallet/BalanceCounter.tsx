import { animate, useMotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { animateBalanceReveal } from '@/lib/gsap'
import { cn } from '@/lib/utils'

interface BalanceCounterProps {
  value: string
  className?: string
}

export function BalanceCounter({ value, className }: BalanceCounterProps) {
  const target = parseFloat(value) || 0
  const motionValue = useMotionValue(target)
  const revealRef = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(target.toFixed(2))

  useEffect(() => {
    if (revealRef.current) {
      animateBalanceReveal(revealRef.current)
    }
  }, [])

  useEffect(() => {
    motionValue.set(parseFloat(value) || 0)

    const controls = animate(motionValue, target, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest.toFixed(2)),
    })

    return () => controls.stop()
  }, [target, value, motionValue])

  return (
    <span
      ref={revealRef}
      className={cn('text-gradient-gold text-5xl font-semibold tracking-tight', className)}
    >
      €{display}
    </span>
  )
}
