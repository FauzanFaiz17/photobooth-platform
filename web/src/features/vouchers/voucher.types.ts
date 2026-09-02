import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/pagination"

export const VOUCHER_STATUSES = ["unused", "redeemed", "expired", "void"] as const
export type VoucherStatus = (typeof VOUCHER_STATUSES)[number]

export interface VoucherPackageRecord {
  id: number
  partner_id: number | null
  name: string
  price: number
  persons: number
  captures: number
  print_count: number
  session_count?: number
  gif_included: boolean
  video_included: boolean
  template_id: number | null
  validity_days: number
  is_active: boolean
  vouchers_count?: number
  created_at: string
  updated_at: string
}

export interface VoucherRedemptionRecord {
  id: number
  voucher_id: number
  payment_id: number | null
  redeemed_by: number | null
  usage_number: number
  redeemed_at: string
}

export interface VoucherRecord {
  id: number
  partner_id: number
  voucher_package_id: number
  code: string
  status: VoucherStatus
  usage_limit: number | null
  usage_count: number | null
  remaining_uses: number
  expired_at: string
  generated_by: number
  redeemed_by: number | null
  redeemed_at: string | null
  package: VoucherPackageRecord
  payment: unknown | null
  redemptions?: ReadonlyArray<VoucherRedemptionRecord>
  created_at: string
  updated_at: string
}

export interface VoucherPackageListFilters {
  search?: string
  scope?: "global" | "partner"
  partner_id?: number
  is_active?: boolean
  sort?: "id" | "name" | "price" | "created_at"
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface VoucherListFilters {
  partner_id?: number
  voucher_package_id?: number
  status?: VoucherStatus
  search?: string
  sort?: "id" | "code" | "status" | "expired_at" | "created_at"
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface VoucherPackageInput {
  partner_id?: number | null
  name: string
  price: number
  persons: number
  captures: number
  print_count: number
  session_count?: number
  gif_included: boolean
  video_included: boolean
  template_id: number | null
  validity_days: number
  is_active: boolean
}

export interface IssueVoucherInput {
  partner_id?: number
  voucher_package_id: number
  code?: string
  idempotency_key: string
  expired_at?: string
}

export interface VoucherPackageListResponse {
  data: ReadonlyArray<VoucherPackageRecord>
  links: PaginationLinks
  meta: PaginationMeta
}

export interface VoucherListResponse {
  data: ReadonlyArray<VoucherRecord>
  links: PaginationLinks
  meta: PaginationMeta
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

function isVoucherStatus(value: unknown): value is VoucherStatus {
  return VOUCHER_STATUSES.some((status) => status === value)
}

export function isVoucherPackageRecord(value: unknown): value is VoucherPackageRecord {
  if (!isRecord(value)) return false
  return (
    isNumber(value.id) &&
    isNullableNumber(value.partner_id) &&
    typeof value.name === "string" &&
    isNumber(value.price) &&
    isNumber(value.persons) &&
    isNumber(value.captures) &&
    isNumber(value.print_count) &&
    (value.session_count === undefined || isNumber(value.session_count)) &&
    typeof value.gif_included === "boolean" &&
    typeof value.video_included === "boolean" &&
    isNullableNumber(value.template_id) &&
    isNumber(value.validity_days) &&
    typeof value.is_active === "boolean" &&
    (value.vouchers_count === undefined || isNumber(value.vouchers_count)) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  )
}

export function isVoucherRedemptionRecord(value: unknown): value is VoucherRedemptionRecord {
  if (!isRecord(value)) return false
  return (
    isNumber(value.id) &&
    isNumber(value.voucher_id) &&
    isNullableNumber(value.payment_id) &&
    isNullableNumber(value.redeemed_by) &&
    isNumber(value.usage_number) &&
    typeof value.redeemed_at === "string"
  )
}

export function isVoucherRecord(value: unknown): value is VoucherRecord {
  if (!isRecord(value)) return false
  return (
    isNumber(value.id) &&
    isNumber(value.partner_id) &&
    isNumber(value.voucher_package_id) &&
    typeof value.code === "string" &&
    isVoucherStatus(value.status) &&
    isNullableNumber(value.usage_limit) &&
    isNullableNumber(value.usage_count) &&
    isNumber(value.remaining_uses) &&
    (value.redemptions === undefined || (Array.isArray(value.redemptions) && value.redemptions.every(isVoucherRedemptionRecord))) &&
    typeof value.expired_at === "string" &&
    isNumber(value.generated_by) &&
    isNullableNumber(value.redeemed_by) &&
    (value.redeemed_at === null || typeof value.redeemed_at === "string") &&
    isVoucherPackageRecord(value.package) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  )
}

export function isVoucherPackageListResponse(value: unknown): value is VoucherPackageListResponse {
  return isRecord(value) && Array.isArray(value.data) && value.data.every(isVoucherPackageRecord) && isPaginationLinks(value.links) && isPaginationMeta(value.meta)
}

export function isVoucherListResponse(value: unknown): value is VoucherListResponse {
  return isRecord(value) && Array.isArray(value.data) && value.data.every(isVoucherRecord) && isPaginationLinks(value.links) && isPaginationMeta(value.meta)
}

export function isVoucherPackageResponse(value: unknown): value is { data: VoucherPackageRecord } {
  return isRecord(value) && isVoucherPackageRecord(value.data)
}

export function isVoucherResponse(value: unknown): value is { data: VoucherRecord } {
  return isRecord(value) && isVoucherRecord(value.data)
}
