import { useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
import { TypeBadge, StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SummaryHistory } from './SummaryHistory'
import { useEventSummaries, useDeleteEvent, useRefreshEvent } from '@/hooks/useEvents'
import { Button } from '@/components/ui/button'

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

function nextRefreshIn(summaryCreatedAt, intervalHours) {
  if (!summaryCreatedAt) return null
  const nextRun = new Date(summaryCreatedAt).getTime() + intervalHours * 3_600_000
  const diff = nextRun - Date.now()
  if (diff <= 0) return 'soon'
  const hrs = Math.floor(diff / 3_600_000)
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins}m`
}

export function EventCard({ event }) {
  const { data: summaries, isLoading } = useEventSummaries(event.id)
  const latest = summaries?.[0]
  const deleteMutation = useDeleteEvent()
  const refreshMutation = useRefreshEvent()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleRefresh = () => refreshMutation.mutate(event.id)

  const handleDelete = () => {
    if (confirmDelete) {
      deleteMutation.mutate(event.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4 transition-colors hover:border-border/80">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 min-w-0">
          <h3 className="font-semibold text-foreground leading-tight truncate">{event.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={event.type} />
            <StatusBadge status={event.status} />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
            title="Force refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 transition-colors ${confirmDelete ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            title={confirmDelete ? 'Click again to confirm' : 'Delete event'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary body */}
      {isLoading ? (
        <div className="space-y-2">
          <div className="animate-pulse h-4 w-3/4 bg-muted rounded" />
          <div className="animate-pulse h-3.5 w-full bg-muted rounded" />
          <div className="animate-pulse h-3.5 w-5/6 bg-muted rounded" />
        </div>
      ) : latest ? (
        <div className="space-y-2">
          <p className="font-medium text-foreground text-sm leading-snug">{latest.headline}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">{latest.detail}</p>
          {latest.progress_value != null && (
            <ProgressBar
              value={latest.progress_value}
              label={latest.progress_label}
              className="pt-1"
            />
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No summary yet — hit refresh to generate one.
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
        <span>Updated {timeAgo(latest?.created_at)}</span>
        {latest && event.refresh_interval_hours < 8760 && (
          <span>Next in {nextRefreshIn(latest.created_at, event.refresh_interval_hours)}</span>
        )}
      </div>

      <SummaryHistory summaries={summaries} />
    </div>
  )
}
