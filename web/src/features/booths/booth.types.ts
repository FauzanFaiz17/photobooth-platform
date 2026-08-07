import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/pagination"

export const BOOTH_STATUSES = [
  "active",
  "maintenance",
  "inactive",
] as const

export type BoothStatus = (typeof BOOTH_STATUSES)[number]
export type BoothSortField = "id" | "name" | "created_at"

export interface BoothPartner {
  id: number
  company_name: string
  brand_name: string | null
}

export interface BoothRecord {
  id: number
  name: string
  location: string | null
  status: BoothStatus
  created_at: string
  partner: BoothPartner
  devices_count?: number
}

export interface BoothListFilters {
  search?: string
  status?: BoothStatus
  partner?: number
  sort?: BoothSortField
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface CreateBoothInput {
  partner_id: number
  name: string
  location?: string | null
  status?: BoothStatus
}

export interface UpdateBoothInput {
  name: string
  location?: string | null
  status: BoothStatus
}

export interface BoothListResponse {
  data: ReadonlyArray<BoothRecord>
  links: PaginationLinks
  meta: PaginationMeta
}

interface BoothResponse {
  data: BoothRecord
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isBoothStatus(value: unknown): value is BoothStatus {
  return BOOTH_STATUSES.some((status) => status === value)
}

function isBoothPartner(value: unknown): value is BoothPartner {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.company_name === "string" &&
    isNullableString(value.brand_name)
  )
}

export function isBoothRecord(value: unknown): value is BoothRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    isNullableString(value.location) &&
    isBoothStatus(value.status) &&
    typeof value.created_at === "string" &&
    isBoothPartner(value.partner) &&
    (value.devices_count === undefined ||
      typeof value.devices_count === "number")
  )
}

export function isBoothListResponse(
  value: unknown
): value is BoothListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isBoothRecord) &&
    isPaginationLinks(value.links) &&
    isPaginationMeta(value.meta)
  )
}

export function isBoothResponse(value: unknown): value is BoothResponse {
  return isRecord(value) && isBoothRecord(value.data)
}
