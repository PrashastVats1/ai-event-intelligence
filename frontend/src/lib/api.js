import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const userId = useAuthStore.getState().userId
  if (userId) {
    config.headers['X-User-Id'] = userId
  }
  return config
})

export const eventsApi = {
  list: () => api.get('/api/events/').then(r => r.data),
  create: (data) => api.post('/api/events/', data).then(r => r.data),
  update: (id, data) => api.patch(`/api/events/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/api/events/${id}`).then(r => r.data),
  refresh: (id) => api.post(`/api/events/${id}/refresh`).then(r => r.data),
  getSummaries: (id) => api.get(`/api/events/${id}/summaries`).then(r => r.data),
}

export default api
