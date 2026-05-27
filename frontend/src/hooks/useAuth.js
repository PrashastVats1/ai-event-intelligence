import { account } from '@/lib/appwrite'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, userId } = useAuthStore()

  const logout = async () => {
    try {
      await account.deleteSession('current')
    } finally {
      useAuthStore.getState().clearUser()
    }
  }

  return { user, userId, logout }
}
