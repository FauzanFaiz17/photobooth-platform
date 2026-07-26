import { isAuthSession, type AuthSession } from "./auth.types"

export const AUTH_SESSION_STORAGE_KEY = "photobooth.auth.session"

export function readAuthSession(): AuthSession | null {
  try {
    const storedValue = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)
    if (!storedValue) return null

    const parsedValue: unknown = JSON.parse(storedValue)
    if (isAuthSession(parsedValue)) return parsedValue

    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    return null
  } catch {
    return null
  }
}

export function writeAuthSession(session: AuthSession): void {
  window.localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify(session)
  )
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
}
