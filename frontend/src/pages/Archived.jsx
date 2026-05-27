import { Navbar } from '@/components/layout/Navbar'
import { EventCard } from '@/components/events/EventCard'
import { EventCardSkeleton } from '@/components/events/EventCardSkeleton'
import { useEvents } from '@/hooks/useEvents'

export default function Archived() {
  const { data: events, isLoading, error } = useEvents()
  const archivedEvents = events?.filter(e => e.status !== 'active') ?? []

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Archived Events</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {archivedEvents.length} event{archivedEvents.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load events
          </div>
        )}

        {!isLoading && !error && archivedEvents.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground text-sm">No archived events yet.</p>
          </div>
        )}

        {!isLoading && !error && archivedEvents.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {archivedEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
