import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface UnitStepperProps {
  value: number
  step: number
  min?: number
  unitLabel: string
  onChange: (value: number) => void
}

export function UnitStepper({ value, step, min = step, unitLabel, onChange }: UnitStepperProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        size="icon"
        variant="outline"
        onClick={() => onChange(Math.max(min, value - step))}
        type="button"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="text-center">
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-sm text-white/60">{unitLabel}</p>
      </div>
      <Button size="icon" variant="outline" onClick={() => onChange(value + step)} type="button">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
