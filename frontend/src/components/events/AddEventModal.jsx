import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateEvent } from '@/hooks/useEvents'

const UNIT_MULTIPLIERS = { hours: 1, days: 24, weeks: 168, months: 720 }
const UNIT_LABELS = ['hours', 'days', 'weeks', 'months']

// Default refresh shown per type (with smart units)
const DEFAULT_REFRESH = {
  box_office: { value: 1,  unit: 'days'  },
  election:   { value: 3,  unit: 'hours' },
  sports:     { value: 1,  unit: 'hours' },
  custom:     { value: 12, unit: 'hours' },
}

// Convert display value+unit → hours for the API
const toHours = (value, unit) => Math.max(1, Math.round(value * UNIT_MULTIPLIERS[unit]))

const EVENT_TYPES = [
  { value: 'box_office', label: 'Box Office' },
  { value: 'election',   label: 'Election'   },
  { value: 'sports',     label: 'Sports'     },
  { value: 'custom',     label: 'Custom'     },
]

export function AddEventModal({ onClose }) {
  const [form, setForm] = useState({
    name:           '',
    type:           'box_office',
    end_condition:  '',
    mode:           'recurring',   // 'recurring' | 'once'
    refreshValue:   DEFAULT_REFRESH.box_office.value,
    refreshUnit:    DEFAULT_REFRESH.box_office.unit,
  })
  const createMutation = useCreateEvent()

  const handleTypeChange = (type) => {
    setForm(f => ({
      ...f,
      type,
      refreshValue: DEFAULT_REFRESH[type].value,
      refreshUnit:  DEFAULT_REFRESH[type].unit,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // 'once' → send 8760h (1 year) so the scheduler barely ever fires;
    // user can always hit the manual refresh button.
    const hours = form.mode === 'once' ? 8760 : toHours(form.refreshValue, form.refreshUnit)

    createMutation.mutate(
      {
        name:                   form.name,
        type:                   form.type,
        end_condition:          form.end_condition || undefined,
        refresh_interval_hours: hours,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border rounded-2xl w-full max-w-md mx-4 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-foreground">Track New Event</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Event name — required */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Event Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={255}
              placeholder="e.g. Dhurandhar 2 box office run"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Type — required */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Type <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTypeChange(value)}
                  className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                    form.type === value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Refresh mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Refresh <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {[
                { id: 'recurring', label: 'Recurring' },
                { id: 'once',      label: 'One-time'  },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mode: m.id }))}
                  className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all ${
                    form.mode === m.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {form.mode === 'recurring' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">Every</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.refreshValue}
                  onChange={e => setForm(f => ({ ...f, refreshValue: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-16 rounded-lg border bg-background px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={form.refreshUnit}
                  onChange={e => setForm(f => ({ ...f, refreshUnit: e.target.value }))}
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {UNIT_LABELS.map(u => (
                    <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                  = {toHours(form.refreshValue, form.refreshUnit)}h
                </span>
              </div>
            )}

            {form.mode === 'once' && (
              <p className="text-xs text-muted-foreground">
                Fetch once, then stop. Use the refresh button to update manually.
              </p>
            )}
          </div>

          {/* End condition — optional */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              End condition{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              maxLength={1000}
              placeholder="e.g. When it surpasses ₹500 crore worldwide"
              value={form.end_condition}
              onChange={e => setForm(f => ({ ...f, end_condition: e.target.value }))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding…' : 'Track Event'}
            </Button>
          </div>

          {createMutation.isError && (
            <p className="text-xs text-destructive text-center">
              {createMutation.error?.response?.data?.detail ?? 'Something went wrong. Try again.'}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
