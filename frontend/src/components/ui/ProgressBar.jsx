import { cn } from '@/lib/utils'

export function ProgressBar({ value, label, className }) {
  const pct = Math.min(100, Math.max(0, (value ?? 0) * 100))

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span>{pct.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
