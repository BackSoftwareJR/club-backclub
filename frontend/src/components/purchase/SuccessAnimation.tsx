import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BalanceCounter } from '@/components/wallet/BalanceCounter'
import { formatCurrency } from '@/lib/utils'

interface SuccessAnimationProps {
  amount: string
  previousBalance: string
  newBalance: string
}

export function SuccessAnimation({ amount, previousBalance, newBalance }: SuccessAnimationProps) {
  const [animatedBalance, setAnimatedBalance] = useState(previousBalance)
  const deducted = Number.parseFloat(amount || '0')

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimatedBalance(newBalance), 240)
    return () => window.clearTimeout(timer)
  }, [newBalance])

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="glass-panel relative mx-auto max-w-sm overflow-hidden p-8 text-center"
      initial={{ opacity: 0, scale: 0.88, y: 12 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        animate={{ opacity: [0.05, 0.22, 0.05], scale: [0.7, 1.2, 1.4] }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-primary),transparent_60%)]"
        transition={{ duration: 1.2, repeat: Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        animate={{ scale: [0.8, 1.1, 1] }}
        className="relative"
        transition={{ duration: 0.5 }}
      >
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
      </motion.div>
      <h2 className="relative mb-2 text-2xl">Purchase Complete</h2>
      <motion.p
        animate={{ opacity: [0, 1], y: [6, 0] }}
        className="relative text-white/60"
        initial={{ opacity: 0, y: 6 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        Deducted {formatCurrency(amount)}
      </motion.p>
      <div className="relative mt-6">
        <motion.p
          animate={{ opacity: [0, 1, 0], y: [0, -12, -20], scale: [0.9, 1.05, 1.05] }}
          className="mb-2 text-sm font-semibold text-red-300"
          initial={{ opacity: 0, y: 0, scale: 0.9 }}
          transition={{ delay: 0.15, duration: 0.9 }}
        >
          -{formatCurrency(deducted.toFixed(2))}
        </motion.p>
        <p className="mb-2 text-sm text-white/50">New balance</p>
        <BalanceCounter value={animatedBalance} />
        <p className="mt-2 text-xs text-white/40">Previously {formatCurrency(previousBalance)}</p>
      </div>
    </motion.div>
  )
}
