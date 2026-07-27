import {
  isUserRecord,
  type UserPartner,
  type UserRecord,
  type UserRole,
} from "@/features/users/user.types"

export type AuthRole = UserRole
export type AuthPartner = UserPartner
export type AuthUser = UserRecord

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  success: true
  message: string
  token: string
  user: AuthUser
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export type AuthStatus = "checking" | "authenticated" | "anonymous"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function isAuthUser(value: unknown): value is AuthUser {
  return isUserRecord(value)
}

export function isAuthSession(value: unknown): value is AuthSession {
  return (
    isRecord(value) &&
    typeof value.token === "string" &&
    value.token.length > 0 &&
    isAuthUser(value.user)
  )
}
