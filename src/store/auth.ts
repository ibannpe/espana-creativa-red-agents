import { create } from 'zustand'
import { User } from '@/types'
import { getCurrentUser } from '@/lib/auth'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, _get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  fetchUser: async () => {
    set({ loading: true })
    try {
      const user = await getCurrentUser()
      set({ user, loading: false })
    } catch (error) {
      console.error('Error fetching user:', error)
      set({ user: null, loading: false })
    }
  }
}))