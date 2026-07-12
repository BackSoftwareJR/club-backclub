import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const glassFieldClass =
  'glass-input w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[16px] text-white placeholder:text-white/35 outline-none transition focus:border-primary/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary/20'

interface GlassFieldLabelProps {
  htmlFor?: string
  children: ReactNode
  hint?: string
  action?: React.ReactNode
}

export function GlassFieldLabel({ htmlFor, children, hint, action }: GlassFieldLabelProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <label className="text-sm font-medium text-white/75" htmlFor={htmlFor}>
        {children}
      </label>
      {action}
      {hint && !action ? <span className="text-xs text-white/40">{hint}</span> : null}
    </div>
  )
}

export const GlassInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function GlassInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(glassFieldClass, className)} {...props} />
  },
)

export const GlassTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function GlassTextarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(glassFieldClass, 'min-h-[112px] resize-none', className)}
      {...props}
    />
  )
})

interface AmountChipRowProps {
  amounts: number[]
  onPick: (amount: string) => void
}

export function AmountChipRow({ amounts, onPick }: AmountChipRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {amounts.map((amount) => (
        <button
          key={amount}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/80 transition active:scale-95 hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
          onClick={() => onPick(amount.toFixed(2))}
          type="button"
        >
          €{amount}
        </button>
      ))}
    </div>
  )
}
