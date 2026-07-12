interface CustomTextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CustomTextInput({ value, onChange, placeholder }: CustomTextInputProps) {
  return (
    <textarea
      className="glass-panel min-h-28 w-full resize-none rounded-xl border-white/10 bg-black/30 p-4 text-white outline-none focus:ring-2 focus:ring-primary/40"
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Describe your request…'}
      value={value}
    />
  )
}
