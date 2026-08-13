import { isPaginationLinks, isPaginationMeta, type PaginationLinks, type PaginationMeta } from "@/lib/pagination"

export interface CustomerRecord {
  id: number
  name: string | null
  phone: string | null
  email: string | null
  partner_id: number | null
  photo_sessions_count: number
  created_at: string
  updated_at: string
}

export interface CustomerListResponse {
  data: ReadonlyArray<CustomerRecord>
  links: PaginationLinks
  meta: PaginationMeta
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

export function isCustomerRecord(value: unknown): value is CustomerRecord {
  return isRecord(value) && typeof value.id === "number" && nullableString(value.name) && nullableString(value.phone) && nullableString(value.email) && (value.partner_id === null || typeof value.partner_id === "number") && typeof value.photo_sessions_count === "number" && typeof value.created_at === "string" && typeof value.updated_at === "string"
}

export function isCustomerListResponse(value: unknown): value is CustomerListResponse {
  return isRecord(value) && Array.isArray(value.data) && value.data.every(isCustomerRecord) && isPaginationLinks(value.links) && isPaginationMeta(value.meta)
}

export function isCustomerResponse(value: unknown): value is { data: CustomerRecord } {
  return isRecord(value) && isCustomerRecord(value.data)
}
