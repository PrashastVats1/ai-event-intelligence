import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function SummaryHistory({ summaries }) {
  const [open, setOpen] = useState(false)

  if (!summaries || summaries.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        History ({summaries.length})
      </button>

      {open && (
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
          {summaries.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1"
            >
              <p className="font-medium text-foreground leading-snug">{s.headline}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{s.detail}</p>
              <p className="text-xs text-muted-foreground/50">{timeAgo(s.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
