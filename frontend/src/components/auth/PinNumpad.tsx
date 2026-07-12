import { motion } from 'framer-motion'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PinNumpadProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (pin: string) => void
  maxLength?: number
  disabled?: boolean
}

export function PinNumpad({
  value,
  onChange,
  onComplete,
  maxLength = 6,
  disabled = false,
}: PinNumpadProps) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

  const press = (key: string) => {
    if (disabled) return
    if (key === 'del') {
      onChange(value.slice(0, -1))
      return
    }
    if (!key || value.length >= maxLength) return
    const next = value + key
    onChange(next)
    if (next.length === maxLength) {
      onComplete?.(next)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="mb-8 flex justify-center gap-3">
        {Array.from({ length: maxLength }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i < value.length ? 1.1 : 1 }}
            className={cn(
              'h-3 w-3 rounded-full border transition-colors',
              i < value.length ? 'border-primary bg-primary' : 'border-white/30 bg-transparent',
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {digits.map((digit, index) => {
          if (digit === '') {
            return <div key={`empty-${index}`} />
          }
          const isDelete = digit === 'del'
          return (
            <motion.button
              key={digit + index}
              className={cn(
                'glass-panel flex h-16 items-center justify-center text-xl font-medium text-white transition hover:bg-white/10 active:scale-95 disabled:opacity-40',
                isDelete && 'text-white/70',
              )}
              disabled={disabled}
              onClick={() => press(digit)}
              type="button"
              whileTap={{ scale: 0.95 }}
            >
              {isDelete ? <Delete className="h-5 w-5" /> : digit}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
