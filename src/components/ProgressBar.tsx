interface ProgressBarProps {
  /** 0-100. Pass null when real progress is unknown: an honest indeterminate bar is shown instead. */
  value: number | null
  label?: string
  className?: string
}

export default function ProgressBar({ value, label, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && <p className="text-sm text-ink-300 mb-2">{label}</p>}
      <div className="h-1.5 bg-slate-750 rounded-full overflow-hidden relative">
        {value === null ? (
          <div
            className="absolute inset-y-0 w-1/3 rounded-full animate-scan"
            style={{ background: 'linear-gradient(90deg, transparent, #5ff0b0, transparent)' }}
            role="progressbar"
            aria-busy="true"
          />
        ) : (
          <div
            className="h-full bg-teal rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(95,240,176,0.6)]"
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            role="progressbar"
            aria-valuenow={Math.round(value)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        )}
      </div>
    </div>
  )
}
