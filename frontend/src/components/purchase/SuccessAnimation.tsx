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

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimatedBalance(newBalance), 150)
    return () => window.clearTimeout(timer)
  }, [newBalance])

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel mx-auto max-w-sm p-8 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
    >
      <motion.div
        animate={{ scale: [0.8, 1.1, 1] }}
        transition={{ duration: 0.5 }}
      >
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
      </motion.div>
      <h2 className="mb-2 text-2xl">Purchase Complete</h2>
      <p className="text-white/60">Deducted {formatCurrency(amount)}</p>
      <div className="mt-6">
        <p className="mb-2 text-sm text-white/50">New balance</p>
        <BalanceCounter value={animatedBalance} />
        <p className="mt-2 text-xs text-white/40">Previously {formatCurrency(previousBalance)}</p>
      </div>
    </motion.div>
  )
}
