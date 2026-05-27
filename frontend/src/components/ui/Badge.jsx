import { cn } from '@/lib/utils'

const TYPE_STYLES = {
  box_office: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  election: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  sports: 'bg-green-500/20 text-green-300 border border-green-500/30',
  custom: 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
}

const TYPE_LABELS = {
  box_office: 'Box Office',
  election: 'Election',
  sports: 'Sports',
  custom: 'Custom',
}

const STATUS_STYLES = {
  active: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  completed: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  archived: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
}

export function TypeBadge({ type, className }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      TYPE_STYLES[type] ?? TYPE_STYLES.custom,
      className
    )}>
      {TYPE_LABELS[type] ?? type}
    </span>
  )
}

export function StatusBadge({ status, className }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      STATUS_STYLES[status] ?? STATUS_STYLES.active,
      className
    )}>
      {status}
    </span>
  )
}
