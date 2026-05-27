import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '@/lib/api'

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.list,
    refetchInterval: 60_000,
  })
}

export function useEventSummaries(eventId, enabled = true) {
  return useQuery({
    queryKey: ['summaries', eventId],
    queryFn: () => eventsApi.getSummaries(eventId),
    enabled: enabled && !!eventId,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eventsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useRefreshEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eventsApi.refresh,
    onSuccess: (_, eventId) => {
      qc.invalidateQueries({ queryKey: ['events'] })
      qc.invalidateQueries({ queryKey: ['summaries', eventId] })
    },
  })
}
