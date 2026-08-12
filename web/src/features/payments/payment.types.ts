import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/pagination"

export const PAYMENT_GATEWAYS = ["midtrans_qris", "voucher", "cash", "other"] as const
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "expired", "refunded"] as const

export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number]
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]
export type PaymentTransitionStatus = Exclude<PaymentStatus, "pending">

export interface PaymentRecord {
  id: number
  partner_id: number
  reference: string
  gateway: PaymentGateway
  amount: number
  fee: number
  net_amount: number
  status: PaymentStatus
  voucher_id: number | null
  expired_at: string | null
  paid_at: string | null
  gateway_response: unknown
  created_at: string
  updated_at: string
}

export interface PaymentListFilters {
  partner_id?: number
  gateway?: PaymentGateway
  status?: PaymentStatus
  search?: string
  sort?: "id" | "amount" | "status" | "paid_at" | "created_at"
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface PaymentListResponse {
  data: ReadonlyArray<PaymentRecord>
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

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

export function isPaymentGateway(value: unknown): value is PaymentGateway {
  return PAYMENT_GATEWAYS.some((gateway) => gateway === value)
}

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return PAYMENT_STATUSES.some((status) => status === value)
}

export function isPaymentRecord(value: unknown): value is PaymentRecord {
  if (!isRecord(value)) return false
  return (
    isNumber(value.id) &&
    isNumber(value.partner_id) &&
    typeof value.reference === "string" &&
    isPaymentGateway(value.gateway) &&
    isNumber(value.amount) &&
    isNumber(value.fee) &&
    isNumber(value.net_amount) &&
    isPaymentStatus(value.status) &&
    isNullableNumber(value.voucher_id) &&
    isNullableString(value.expired_at) &&
    isNullableString(value.paid_at) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  )
}

export function isPaymentListResponse(value: unknown): value is PaymentListResponse {
  return isRecord(value) && Array.isArray(value.data) && value.data.every(isPaymentRecord) && isPaginationLinks(value.links) && isPaginationMeta(value.meta)
}

export function isPaymentResponse(value: unknown): value is { data: PaymentRecord } {
  return isRecord(value) && isPaymentRecord(value.data)
}
