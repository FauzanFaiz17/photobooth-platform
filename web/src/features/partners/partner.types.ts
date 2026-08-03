import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/pagination"

export type { SortDirection } from "@/lib/pagination"

export const PARTNER_STATUSES = [
  "active",
  "suspended",
  "trial",
  "inactive",
] as const

export const PARTNER_SORT_FIELDS = [
  "id",
  "company_name",
  "created_at",
] as const

export const PARTNER_SUBSCRIPTION_STATUSES = [
  "pending",
  "active",
  "expired",
  "cancelled",
] as const

/** Batas per_page yang diterima PartnerIndexRequest di backend. */
export const PARTNER_PER_PAGE_MIN = 5
export const PARTNER_PER_PAGE_MAX = 100

export type PartnerStatus = (typeof PARTNER_STATUSES)[number]
export type PartnerSortField = (typeof PARTNER_SORT_FIELDS)[number]
export type PartnerSubscriptionStatus =
  (typeof PARTNER_SUBSCRIPTION_STATUSES)[number]

/**
 * Plan memakai optional chaining di PartnerResource, jadi field-nya
 * diperlakukan nullable.
 */
export interface PartnerSubscriptionPlan {
  id: number | null
  name: string | null
}

export interface PartnerSubscription {
  id: number
  status: PartnerSubscriptionStatus
  starts_at: string
  ends_at: string
  plan: PartnerSubscriptionPlan
}

export interface PartnerRecord {
  id: number
  company_name: string
  brand_name: string | null
  slug: string
  address: string | null
  phone: string | null
  email: string
  tax_number: string | null
  /** Berasal dari kolom logo_path, belum bisa diisi lewat API. */
  logo: string | null
  status: PartnerStatus
  created_at: string
  /** null ketika partner tidak punya subscription berstatus active. */
  subscription: PartnerSubscription | null
}

export interface PartnerListFilters {
  search?: string
  status?: PartnerStatus
  sort?: PartnerSortField
  direction?: SortDirection
  per_page?: number
  page?: number
}

/** slug dibuat otomatis oleh backend dan tidak boleh dikirim. */
export interface CreatePartnerInput {
  company_name: string
  brand_name?: string | null
  address?: string | null
  phone?: string | null
  email: string
  tax_number?: string | null
  /** Opsional; backend memakai "trial" saat tidak dikirim. */
  status?: PartnerStatus
}

/** Endpoint update memakai PUT, jadi seluruh field dikirim ulang. */
export interface UpdatePartnerInput {
  company_name: string
  brand_name?: string | null
  address?: string | null
  phone?: string | null
  email: string
  tax_number?: string | null
  status: PartnerStatus
}

export interface PartnerListResponse {
  data: ReadonlyArray<PartnerRecord>
  links: PaginationLinks
  meta: PaginationMeta
}

export interface PartnerResponse {
  data: PartnerRecord
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

export function isPartnerStatus(value: unknown): value is PartnerStatus {
  return PARTNER_STATUSES.some((status) => status === value)
}

export function isPartnerSortField(
  value: unknown
): value is PartnerSortField {
  return PARTNER_SORT_FIELDS.some((field) => field === value)
}

export function isPartnerSubscriptionStatus(
  value: unknown
): value is PartnerSubscriptionStatus {
  return PARTNER_SUBSCRIPTION_STATUSES.some((status) => status === value)
}

function isPartnerSubscriptionPlan(
  value: unknown
): value is PartnerSubscriptionPlan {
  if (!isRecord(value)) return false

  return isNullableNumber(value.id) && isNullableString(value.name)
}

function isPartnerSubscription(
  value: unknown
): value is PartnerSubscription | null {
  if (value === null) return true
  if (!isRecord(value)) return false

  return (
    isNumber(value.id) &&
    isPartnerSubscriptionStatus(value.status) &&
    typeof value.starts_at === "string" &&
    typeof value.ends_at === "string" &&
    isPartnerSubscriptionPlan(value.plan)
  )
}

export function isPartnerRecord(value: unknown): value is PartnerRecord {
  if (!isRecord(value)) return false

  return (
    isNumber(value.id) &&
    typeof value.company_name === "string" &&
    isNullableString(value.brand_name) &&
    typeof value.slug === "string" &&
    isNullableString(value.address) &&
    isNullableString(value.phone) &&
    typeof value.email === "string" &&
    isNullableString(value.tax_number) &&
    isNullableString(value.logo) &&
    isPartnerStatus(value.status) &&
    typeof value.created_at === "string" &&
    isPartnerSubscription(value.subscription)
  )
}

export function isPartnerListResponse(
  value: unknown
): value is PartnerListResponse {
  if (!isRecord(value)) return false

  return (
    Array.isArray(value.data) &&
    value.data.every(isPartnerRecord) &&
    isPaginationLinks(value.links) &&
    isPaginationMeta(value.meta)
  )
}

export function isPartnerResponse(value: unknown): value is PartnerResponse {
  return isRecord(value) && isPartnerRecord(value.data)
}
