import { cn } from '@/lib/utils'

function Sk({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export function EventCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-5 w-36" />
          <div className="flex gap-2">
            <Sk className="h-4 w-20 rounded-full" />
            <Sk className="h-4 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex gap-1">
          <Sk className="h-7 w-7 rounded-md" />
          <Sk className="h-7 w-7 rounded-md" />
        </div>
      </div>
      <div className="space-y-2">
        <Sk className="h-4 w-3/4" />
        <Sk className="h-3.5 w-full" />
        <Sk className="h-3.5 w-5/6" />
        <Sk className="h-3.5 w-4/5" />
      </div>
      <Sk className="h-1.5 w-full rounded-full" />
      <div className="flex justify-between pt-1 border-t border-border/50">
        <Sk className="h-3 w-24" />
        <Sk className="h-3 w-28" />
      </div>
    </div>
  )
}
