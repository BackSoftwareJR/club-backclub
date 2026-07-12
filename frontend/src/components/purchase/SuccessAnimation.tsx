import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SuccessAnimationProps {
  amount: string
  newBalance: string
}

export function SuccessAnimation({ amount, newBalance }: SuccessAnimationProps) {
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
      <p className="mt-4 text-lg">
        New balance: <span className="text-primary">{formatCurrency(newBalance)}</span>
      </p>
    </motion.div>
  )
}
