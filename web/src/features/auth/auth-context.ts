import { createContext, useContext } from "react"

import type {
  AuthStatus,
  AuthUser,
  LoginCredentials,
} from "./auth.types"

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  status: AuthStatus
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}
