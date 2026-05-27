import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { TabBar } from '@/components/layout/TabBar'
import { EventCard } from '@/components/events/EventCard'
import { EventCardSkeleton } from '@/components/events/EventCardSkeleton'
import { AddEventModal } from '@/components/events/AddEventModal'
import { Button } from '@/components/ui/button'
import { useEvents } from '@/hooks/useEvents'

export default function Dashboard() {
  const { data: events, isLoading, error } = useEvents()
  const [tab, setTab] = useState('active')
  const [showAddModal, setShowAddModal] = useState(false)

  const activeEvents = events?.filter(e => e.status === 'active') ?? []
  const archivedEvents = events?.filter(e => e.status !== 'active') ?? []
  const visibleEvents = tab === 'active' ? activeEvents : archivedEvents

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">My Events</h1>
            {!isLoading && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeEvents.length} active · {archivedEvents.length} archived
              </p>
            )}
          </div>
          <Button onClick={() => setShowAddModal(true)} className="gap-1.5" size="sm">
            <Plus className="w-4 h-4" />
            Track Event
          </Button>
        </div>

        {/* Tab bar */}
        <TabBar
          active={tab}
          onChange={setTab}
          counts={{ active: activeEvents.length, archived: archivedEvents.length }}
        />

        {/* Content */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load events:{' '}
            {error?.response?.data?.detail ?? error.message ?? 'Unknown error'}
          </div>
        )}

        {!isLoading && !error && (
          visibleEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
              <p className="text-muted-foreground text-sm">
                {tab === 'active'
                  ? "No active events. Start tracking something!"
                  : 'No archived events yet.'}
              </p>
              {tab === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add your first event
                </Button>
              )}
            </div>
          )
        )}
      </main>

      {showAddModal && <AddEventModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
}
