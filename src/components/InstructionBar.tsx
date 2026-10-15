import { useState } from 'react'
import { Wand2 } from 'lucide-react'

const EXAMPLES = [
  'Explain it simply, in 5 bullet points',
  'Focus on definitions and exceptions',
  'Write it like exam revision notes',
  'Facts, issue, holding, reasoning',
]

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
  submitLabel?: string
  disabled?: boolean
}

/** One-line prompt telling the local model how to summarise. */
export default function InstructionBar({ value, onChange, onSubmit, submitLabel, disabled }: Props) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor="summary-instruction" className="eyebrow block mb-2">How should the AI summarise?</label>
      <div className={`flex gap-2 glass p-1.5 transition-shadow ${focused ? 'shadow-[0_0_0_1px_rgba(95,240,176,0.5),0_0_24px_rgba(95,240,176,0.15)]' : ''}`}>
        <div className="flex items-center pl-2 text-teal"><Wand2 size={15} /></div>
        <input
          id="summary-instruction"
          type="text"
          maxLength={240}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' && onSubmit) onSubmit() }}
          placeholder="e.g. Explain it simply, in 5 bullet points"
          className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-ink-500 outline-none py-2"
        />
        {onSubmit && (
          <button onClick={onSubmit} disabled={disabled} className="btn-primary text-sm py-1.5 shrink-0">
            {submitLabel ?? 'Apply'}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onChange(ex)}
            className="text-2xs px-2 py-1 rounded-full border border-slate-750 text-ink-300 hover:text-white hover:border-teal/50 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
      <p className="text-2xs text-ink-500 mt-2">
        Followed by the local AI model (a small model: simple style instructions work best). The instant summary ignores it.
      </p>
    </div>
  )
}
