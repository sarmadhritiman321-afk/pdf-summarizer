interface ProgressBarProps {
  value: number // 0–100
  label?: string
  className?: string
}

export default function ProgressBar({ value, label, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && <p className="text-sm text-ink-300 mb-2">{label}</p>}
      <div className="h-1.5 bg-slate-750 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
