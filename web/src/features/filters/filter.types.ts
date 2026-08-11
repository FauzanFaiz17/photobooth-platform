import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/pagination"

export interface FilterPartner {
  id: number
  company_name: string
}

export interface FilterRecord {
  id: number
  partner: FilterPartner | null
  is_global: boolean
  name: string
  lut_path: string | null
  brightness: number
  contrast: number
  saturation: number
  sharpness: number
  white_balance: number
  intensity: number
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FilterListFilters {
  search?: string
  scope?: "global" | "partner"
  partner_id?: number
  is_active?: boolean
  sort?: "id" | "created_at" | "updated_at" | "version"
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface FilterInput {
  partner_id?: number | null
  name: string
  lut_path?: string | null
  brightness: number
  contrast: number
  saturation: number
  sharpness: number
  white_balance: number
  intensity: number
  is_active: boolean
}

export interface FilterListResponse {
  data: ReadonlyArray<FilterRecord>
  links: PaginationLinks
  meta: PaginationMeta
}

interface FilterResponse {
  data: FilterRecord
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isPartner(value: unknown): value is FilterPartner | null {
  return value === null || (isRecord(value) && typeof value.id === "number" && typeof value.company_name === "string")
}

export function isFilterRecord(value: unknown): value is FilterRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    isPartner(value.partner) &&
    typeof value.is_global === "boolean" &&
    typeof value.name === "string" &&
    isNullableString(value.lut_path) &&
    typeof value.brightness === "number" &&
    typeof value.contrast === "number" &&
    typeof value.saturation === "number" &&
    typeof value.sharpness === "number" &&
    typeof value.white_balance === "number" &&
    typeof value.intensity === "number" &&
    typeof value.version === "number" &&
    typeof value.is_active === "boolean" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  )
}

export function isFilterListResponse(value: unknown): value is FilterListResponse {
  return isRecord(value) && Array.isArray(value.data) && value.data.every(isFilterRecord) && isPaginationLinks(value.links) && isPaginationMeta(value.meta)
}

export function isFilterResponse(value: unknown): value is FilterResponse {
  return isRecord(value) && isFilterRecord(value.data)
}
