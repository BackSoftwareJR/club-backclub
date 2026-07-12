import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LuxurySpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
}

export function LuxurySpinner({ size = 'md', label, className }: LuxurySpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        className={cn(
          'relative rounded-full border-2 border-primary/20',
          sizeMap[size],
        )}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary shadow-[0_0_20px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]" />
        <span className="absolute inset-[30%] rounded-full bg-primary/30 blur-sm" />
      </motion.div>
      {label ? (
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">{label}</p>
      ) : null}
    </div>
  )
}
