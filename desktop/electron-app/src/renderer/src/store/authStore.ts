import { create } from 'zustand'
import { AuthUser } from '@/features/auth/types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  authenticated: boolean

  login: (token: string, user: AuthUser) => void

  logout: () => void

  setUser: (user: AuthUser | null) => void

  setToken: (token: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  authenticated: false,

  login: (token, user) =>
    set({
      token,
      user,
      authenticated: true
    }),

  logout: () =>
    set({
      token: null,
      user: null,
      authenticated: false
    }),

  setUser: (user) => set({ user }),

  setToken: (token) =>
    set({
      token,
      authenticated: !!token
    })
}))
