export type SortDirection = "asc" | "desc"

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

export function isSortDirection(value: unknown): value is SortDirection {
  return value === "asc" || value === "desc"
}

export function isPaginationLink(value: unknown): value is PaginationLink {
  if (!isRecord(value)) return false

  return (
    isNullableString(value.url) &&
    typeof value.label === "string" &&
    typeof value.active === "boolean"
  )
}

export function isPaginationLinks(value: unknown): value is PaginationLinks {
  if (!isRecord(value)) return false

  return (
    typeof value.first === "string" &&
    typeof value.last === "string" &&
    isNullableString(value.prev) &&
    isNullableString(value.next)
  )
}

export function isPaginationMeta(value: unknown): value is PaginationMeta {
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
