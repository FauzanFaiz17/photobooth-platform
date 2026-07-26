import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  loginRequest,
  logoutRequest,
  profileRequest,
} from "./auth-api"
import { AuthContext, type AuthContextValue } from "./auth-context"
import {
  AUTH_SESSION_STORAGE_KEY,
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
} from "./auth-storage"
import type {
  AuthSession,
  AuthStatus,
  LoginCredentials,
} from "./auth.types"

interface AuthState {
  session: AuthSession | null
  status: AuthStatus
}

function createInitialState(): AuthState {
  const session = readAuthSession()

  return {
    session,
    status: session ? "checking" : "anonymous",
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(createInitialState)

  useEffect(() => {
    const storedSession = readAuthSession()
    if (!storedSession) return

    let isActive = true

    profileRequest(storedSession.token)
      .then((user) => {
        if (!isActive) return

        const refreshedSession = {
          token: storedSession.token,
          user,
        }

        writeAuthSession(refreshedSession)
        setAuthState({
          session: refreshedSession,
          status: "authenticated",
        })
      })
      .catch(() => {
        if (!isActive) return

        clearAuthSession()
        setAuthState({ session: null, status: "anonymous" })
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key !== AUTH_SESSION_STORAGE_KEY) return

      const nextSession = readAuthSession()
      setAuthState({
        session: nextSession,
        status: nextSession ? "authenticated" : "anonymous",
      })
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginRequest(credentials)
    const session = {
      token: response.token,
      user: response.user,
    }

    writeAuthSession(session)
    setAuthState({ session, status: "authenticated" })
  }, [])

  const logout = useCallback(async () => {
    const token = authState.session?.token

    try {
      if (token) {
        await logoutRequest(token)
      }
    } catch {
      // Local logout must still finish if the backend is temporarily unreachable.
    } finally {
      clearAuthSession()
      setAuthState({ session: null, status: "anonymous" })
    }
  }, [authState.session?.token])

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user: authState.session?.user ?? null,
      status: authState.status,
      login,
      logout,
    }),
    [authState.session?.user, authState.status, login, logout]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
