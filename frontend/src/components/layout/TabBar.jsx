import { cn } from '@/lib/utils'

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
]

export function TabBar({ active, onChange, counts = {} }) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-1.5 text-sm rounded-md font-medium transition-all flex items-center gap-1.5',
            active === tab.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
          {counts[tab.id] != null && (
            <span className={cn(
              'text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center',
              active === tab.id
                ? 'bg-muted text-muted-foreground'
                : 'bg-background/50 text-muted-foreground'
            )}>
              {counts[tab.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
