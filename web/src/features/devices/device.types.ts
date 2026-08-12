import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/pagination"

export const DEVICE_STATUSES = ["pending", "active", "blocked", "revoked"] as const
export const DEVICE_PRESENCES = ["online", "stale", "offline"] as const

export type DeviceStatus = (typeof DEVICE_STATUSES)[number]
export type DevicePresence = (typeof DEVICE_PRESENCES)[number]

export interface DeviceRecord {
  id: number
  device_key: string
  device_uuid: string | null
  device_name: string
  status: DeviceStatus
  activation_expires_at: string | null
  activated_at: string | null
  app_version: string | null
  last_sync_at: string | null
  last_login_at: string | null
  presence_status: DevicePresence
  presence_age_seconds: number | null
  partner: { id: number; company_name: string } | null
  booth: { id: number; name: string } | null
}

export interface DeviceListFilters {
  search?: string
  status?: DeviceStatus
  presence?: DevicePresence
  booth_id?: number
  partner_id?: number
  sort?: "id" | "device_name" | "status" | "created_at" | "activated_at"
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface DeviceListResponse {
  data: ReadonlyArray<DeviceRecord>
  links: PaginationLinks
  meta: PaginationMeta
}

export interface CreateDeviceInput {
  partner_id: number
  booth_id: number
  device_name: string
}

export interface UpdateDeviceInput {
  booth_id: number
  device_name: string
  status: DeviceStatus
}

export interface DeviceActivationResult {
  device: DeviceRecord
  activation_code: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isDeviceStatus(value: unknown): value is DeviceStatus {
  return DEVICE_STATUSES.some((status) => status === value)
}

function isDevicePresence(value: unknown): value is DevicePresence {
  return DEVICE_PRESENCES.some((presence) => presence === value)
}

function isPartner(value: unknown): value is DeviceRecord["partner"] {
  return value === null || (isRecord(value) && typeof value.id === "number" && typeof value.company_name === "string")
}

function isBooth(value: unknown): value is DeviceRecord["booth"] {
  return value === null || (isRecord(value) && typeof value.id === "number" && typeof value.name === "string")
}

export function isDeviceRecord(value: unknown): value is DeviceRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.device_key === "string" &&
    isNullableString(value.device_uuid) &&
    typeof value.device_name === "string" &&
    isDeviceStatus(value.status) &&
    isNullableString(value.activation_expires_at) &&
    isNullableString(value.activated_at) &&
    isNullableString(value.app_version) &&
    isNullableString(value.last_sync_at) &&
    isNullableString(value.last_login_at) &&
    isDevicePresence(value.presence_status) &&
    (value.presence_age_seconds === null || typeof value.presence_age_seconds === "number") &&
    isPartner(value.partner) &&
    isBooth(value.booth)
  )
}

export function isDeviceListResponse(value: unknown): value is DeviceListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isDeviceRecord) &&
    isPaginationLinks(value.links) &&
    isPaginationMeta(value.meta)
  )
}

export function isDeviceResponse(value: unknown): value is { data: DeviceRecord } {
  return isRecord(value) && isDeviceRecord(value.data)
}

export function isDeviceActivationResponse(value: unknown): value is { data: DeviceActivationResult } {
  return (
    isRecord(value) &&
    isRecord(value.data) &&
    isDeviceRecord(value.data.device) &&
    typeof value.data.activation_code === "string"
  )
}
