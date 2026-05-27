import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      userId: null,
      initialized: false,
      setUser: (user) => set({ user, userId: user?.$id ?? null, initialized: true }),
      clearUser: () => set({ user: null, userId: null, initialized: true }),
    }),
    {
      name: 'auth-storage',
      // Don't persist `initialized` — it must reset to false on every page load
      partialize: (state) => ({ user: state.user, userId: state.userId }),
    }
  )
)
