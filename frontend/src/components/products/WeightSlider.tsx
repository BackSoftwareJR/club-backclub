interface WeightSliderProps {
  value: number
  min: number
  max: number
  step: number
  unitLabel: string
  onChange: (value: number) => void
}

export function WeightSlider({
  value,
  min,
  max,
  step,
  unitLabel,
  onChange,
}: WeightSliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <span className="text-3xl font-semibold">{value}</span>
        <span className="text-sm text-white/60">{unitLabel}</span>
      </div>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-primary"
        max={max}
        min={min}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        step={step}
        type="range"
        value={value}
      />
      <div className="flex justify-between text-xs text-white/40">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
