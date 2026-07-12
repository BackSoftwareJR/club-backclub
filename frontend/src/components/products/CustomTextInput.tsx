interface CustomTextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CustomTextInput({ value, onChange, placeholder }: CustomTextInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-white/60" htmlFor="custom-request">
        Your request
      </label>
      <input
        className="w-full border-0 border-b border-white/30 bg-transparent px-0 py-3 text-lg text-white outline-none transition placeholder:text-white/30 focus:border-primary"
        id="custom-request"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Describe your request…'}
        type="text"
        value={value}
      />
    </div>
  )
}
