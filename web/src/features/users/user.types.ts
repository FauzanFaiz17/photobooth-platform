export const USER_STATUSES = [
  "active",
  "suspended",
  "invited",
  "inactive",
] as const

export const USER_SORT_FIELDS = [
  "id",
  "name",
  "email",
  "created_at",
  "last_login_at",
] as const

export type UserStatus = (typeof USER_STATUSES)[number]
export type UserSortField = (typeof USER_SORT_FIELDS)[number]
export type SortDirection = "asc" | "desc"

export interface UserRole {
  id: number | null
  name: string | null
  slug: string | null
}

export interface UserPartner {
  id: number
  company_name: string
  brand_name: string | null
}

export interface UserRecord {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null
  status: UserStatus
  last_login_at: string | null
  created_at: string
  role: UserRole
  partner: UserPartner | null
}

export interface UserListFilters {
  search?: string
  role?: number
  partner?: number
  status?: UserStatus
  sort?: UserSortField
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface CreateUserInput {
  name: string
  email: string
  phone?: string | null
  password: string
  password_confirmation: string
  role_id: number
  partner_id?: number | null
  status?: UserStatus
}

export interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

export interface PaginationLinks {
  first: string
  last: string
  prev: string | null
  next: string | null
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  links: ReadonlyArray<PaginationLink>
  path: string
  per_page: number
  to: number | null
  total: number
}

export interface UserListResponse {
  data: ReadonlyArray<UserRecord>
  links: PaginationLinks
  meta: PaginationMeta
}

export interface UserResponse {
  data: UserRecord
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

export function isUserStatus(value: unknown): value is UserStatus {
  return (
    value === "active" ||
    value === "suspended" ||
    value === "invited" ||
    value === "inactive"
  )
}

export function isUserSortField(value: unknown): value is UserSortField {
  return (
    value === "id" ||
    value === "name" ||
    value === "email" ||
    value === "created_at" ||
    value === "last_login_at"
  )
}

export function isSortDirection(value: unknown): value is SortDirection {
  return value === "asc" || value === "desc"
}

function isUserRole(value: unknown): value is UserRole {
  if (!isRecord(value)) return false

  return (
    isNullableNumber(value.id) &&
    isNullableString(value.name) &&
    isNullableString(value.slug)
  )
}

function isUserPartner(value: unknown): value is UserPartner | null {
  if (value === null) return true
  if (!isRecord(value)) return false

  return (
    isNumber(value.id) &&
    typeof value.company_name === "string" &&
    isNullableString(value.brand_name)
  )
}

export function isUserRecord(value: unknown): value is UserRecord {
  if (!isRecord(value)) return false

  return (
    isNumber(value.id) &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    isNullableString(value.phone) &&
    isNullableString(value.avatar) &&
    isUserStatus(value.status) &&
    isNullableString(value.last_login_at) &&
    typeof value.created_at === "string" &&
    isUserRole(value.role) &&
    isUserPartner(value.partner)
  )
}

function isPaginationLink(value: unknown): value is PaginationLink {
  if (!isRecord(value)) return false

  return (
    isNullableString(value.url) &&
    typeof value.label === "string" &&
    typeof value.active === "boolean"
  )
}

function isPaginationLinks(value: unknown): value is PaginationLinks {
  if (!isRecord(value)) return false

  return (
    typeof value.first === "string" &&
    typeof value.last === "string" &&
    isNullableString(value.prev) &&
    isNullableString(value.next)
  )
}

function isPaginationMeta(value: unknown): value is PaginationMeta {
  if (!isRecord(value)) return false

  return (
    isNumber(value.current_page) &&
    isNullableNumber(value.from) &&
    isNumber(value.last_page) &&
    Array.isArray(value.links) &&
    value.links.every(isPaginationLink) &&
    typeof value.path === "string" &&
    isNumber(value.per_page) &&
    isNullableNumber(value.to) &&
    isNumber(value.total)
  )
}

export function isUserListResponse(value: unknown): value is UserListResponse {
  if (!isRecord(value)) return false

  return (
    Array.isArray(value.data) &&
    value.data.every(isUserRecord) &&
    isPaginationLinks(value.links) &&
    isPaginationMeta(value.meta)
  )
}

export function isUserResponse(value: unknown): value is UserResponse {
  return isRecord(value) && isUserRecord(value.data)
}
