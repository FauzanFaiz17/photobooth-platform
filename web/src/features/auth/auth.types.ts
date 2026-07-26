export interface AuthRole {
  id: number | null
  name: string | null
  slug: string | null
}

export interface AuthPartner {
  id: number
  company_name: string
  brand_name: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null
  status: string
  last_login_at: string | null
  created_at: string
  role: AuthRole
  partner: AuthPartner | null
}

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

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null
}

function isAuthRole(value: unknown): value is AuthRole {
  if (!isRecord(value)) return false

  return (
    (typeof value.id === "number" || value.id === null) &&
    isNullableString(value.name) &&
    isNullableString(value.slug)
  )
}

function isAuthPartner(value: unknown): value is AuthPartner | null {
  if (value === null) return true
  if (!isRecord(value)) return false

  return (
    typeof value.id === "number" &&
    typeof value.company_name === "string" &&
    typeof value.brand_name === "string"
  )
}

export function isAuthUser(value: unknown): value is AuthUser {
  if (!isRecord(value)) return false

  return (
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    isNullableString(value.phone) &&
    isNullableString(value.avatar) &&
    typeof value.status === "string" &&
    isNullableString(value.last_login_at) &&
    typeof value.created_at === "string" &&
    isAuthRole(value.role) &&
    isAuthPartner(value.partner)
  )
}

export function isAuthSession(value: unknown): value is AuthSession {
  return (
    isRecord(value) &&
    typeof value.token === "string" &&
    value.token.length > 0 &&
    isAuthUser(value.user)
  )
}
