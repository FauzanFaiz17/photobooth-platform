import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/pagination"

export interface CameraProfilePartner {
  id: number
  company_name: string
}

export interface CameraProfileRecord {
  id: number
  partner: CameraProfilePartner | null
  is_global: boolean
  name: string
  iso: string | null
  shutter_speed: string | null
  aperture: string | null
  white_balance: string | null
  exposure: string | null
  focus_mode: string | null
  countdown_seconds: number
  burst_count: number
  image_quality: string | null
  live_view: boolean
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CameraProfileListFilters {
  search?: string
  scope?: "global" | "partner"
  partner_id?: number
  is_active?: boolean
  sort?: "id" | "created_at" | "updated_at" | "version"
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface CameraProfileInput {
  partner_id?: number | null
  name: string
  iso?: string | null
  shutter_speed?: string | null
  aperture?: string | null
  white_balance?: string | null
  exposure?: string | null
  focus_mode?: string | null
  countdown_seconds: number
  burst_count: number
  image_quality?: string | null
  live_view: boolean
  is_active: boolean
}

export interface CameraProfileListResponse {
  data: ReadonlyArray<CameraProfileRecord>
  links: PaginationLinks
  meta: PaginationMeta
}

interface CameraProfileResponse {
  data: CameraProfileRecord
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isCameraPartner(
  value: unknown
): value is CameraProfilePartner | null {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.id === "number" &&
      typeof value.company_name === "string")
  )
}

export function isCameraProfileRecord(
  value: unknown
): value is CameraProfileRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    isCameraPartner(value.partner) &&
    typeof value.is_global === "boolean" &&
    typeof value.name === "string" &&
    isNullableString(value.iso) &&
    isNullableString(value.shutter_speed) &&
    isNullableString(value.aperture) &&
    isNullableString(value.white_balance) &&
    isNullableString(value.exposure) &&
    isNullableString(value.focus_mode) &&
    typeof value.countdown_seconds === "number" &&
    typeof value.burst_count === "number" &&
    isNullableString(value.image_quality) &&
    typeof value.live_view === "boolean" &&
    typeof value.version === "number" &&
    typeof value.is_active === "boolean" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  )
}

export function isCameraProfileListResponse(
  value: unknown
): value is CameraProfileListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isCameraProfileRecord) &&
    isPaginationLinks(value.links) &&
    isPaginationMeta(value.meta)
  )
}

export function isCameraProfileResponse(
  value: unknown
): value is CameraProfileResponse {
  return isRecord(value) && isCameraProfileRecord(value.data)
}
