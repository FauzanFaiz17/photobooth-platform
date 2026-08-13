import { isPaginationLinks, isPaginationMeta, type PaginationLinks, type PaginationMeta, type SortDirection } from "@/lib/pagination"

export const BILLING_CYCLES = ["monthly", "yearly"] as const
export const SUBSCRIPTION_STATUSES = ["pending", "active", "expired", "cancelled"] as const
export type BillingCycle = (typeof BILLING_CYCLES)[number]
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export interface SubscriptionPlanRecord {
  id: number
  name: string
  price: number
  billing_cycle: BillingCycle
  max_booths: number
  max_devices: number
  max_operators: number
  features: ReadonlyArray<string> | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PartnerSubscriptionRecord {
  id: number
  status: SubscriptionStatus
  starts_at: string
  ends_at: string
  auto_renew: boolean
  cancelled_at: string | null
  is_current: boolean
  remaining_days: number
  partner: { id: number; company_name: string; slug: string } | null
  plan: { id: number; name: string; billing_cycle: BillingCycle; price: number; max_booths: number; max_devices: number; max_operators: number }
  created_at: string
  updated_at: string
}

export interface SubscriptionPlanInput { name: string; price: number; billing_cycle: BillingCycle; max_booths: number; max_devices: number; max_operators: number; features: ReadonlyArray<string>; is_active: boolean }
export interface PartnerSubscriptionInput { partner_id: number; subscription_plan_id: number; status?: "pending" | "active"; starts_at?: string; ends_at?: string; auto_renew?: boolean }
export interface RenewSubscriptionInput { subscription_plan_id?: number; periods?: number; auto_renew?: boolean }
export interface SubscriptionPlanFilters { search?: string; is_active?: boolean; sort?: "id" | "name" | "price" | "created_at"; direction?: SortDirection; per_page?: number; page?: number }
export interface PartnerSubscriptionFilters { partner_id?: number; subscription_plan_id?: number; status?: SubscriptionStatus; sort?: "starts_at" | "ends_at" | "created_at" | "status"; direction?: SortDirection; per_page?: number; page?: number }
export interface SubscriptionPlanListResponse { data: ReadonlyArray<SubscriptionPlanRecord>; links: PaginationLinks; meta: PaginationMeta }
export interface PartnerSubscriptionListResponse { data: ReadonlyArray<PartnerSubscriptionRecord>; links: PaginationLinks; meta: PaginationMeta }

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null }
function isNumber(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) }
function isNullableString(value: unknown): value is string | null { return value === null || typeof value === "string" }
function isBillingCycle(value: unknown): value is BillingCycle { return BILLING_CYCLES.some((item) => item === value) }
export function isSubscriptionStatus(value: unknown): value is SubscriptionStatus { return SUBSCRIPTION_STATUSES.some((item) => item === value) }
export function isSubscriptionPlanRecord(value: unknown): value is SubscriptionPlanRecord { return isRecord(value) && isNumber(value.id) && typeof value.name === "string" && isNumber(value.price) && isBillingCycle(value.billing_cycle) && isNumber(value.max_booths) && isNumber(value.max_devices) && isNumber(value.max_operators) && (value.features === null || (Array.isArray(value.features) && value.features.every((item) => typeof item === "string"))) && typeof value.is_active === "boolean" && typeof value.created_at === "string" && typeof value.updated_at === "string" }
export function isPartnerSubscriptionRecord(value: unknown): value is PartnerSubscriptionRecord { return isRecord(value) && isNumber(value.id) && isSubscriptionStatus(value.status) && typeof value.starts_at === "string" && typeof value.ends_at === "string" && typeof value.auto_renew === "boolean" && isNullableString(value.cancelled_at) && typeof value.is_current === "boolean" && isNumber(value.remaining_days) && (value.partner === null || (isRecord(value.partner) && isNumber(value.partner.id) && typeof value.partner.company_name === "string" && typeof value.partner.slug === "string")) && isRecord(value.plan) && isNumber(value.plan.id) && typeof value.plan.name === "string" && isBillingCycle(value.plan.billing_cycle) && isNumber(value.plan.price) && isNumber(value.plan.max_booths) && isNumber(value.plan.max_devices) && isNumber(value.plan.max_operators) && typeof value.created_at === "string" && typeof value.updated_at === "string" }
export function isSubscriptionPlanListResponse(value: unknown): value is SubscriptionPlanListResponse { return isRecord(value) && Array.isArray(value.data) && value.data.every(isSubscriptionPlanRecord) && isPaginationLinks(value.links) && isPaginationMeta(value.meta) }
export function isPartnerSubscriptionListResponse(value: unknown): value is PartnerSubscriptionListResponse { return isRecord(value) && Array.isArray(value.data) && value.data.every(isPartnerSubscriptionRecord) && isPaginationLinks(value.links) && isPaginationMeta(value.meta) }
export function isSubscriptionPlanResponse(value: unknown): value is { data: SubscriptionPlanRecord } { return isRecord(value) && isSubscriptionPlanRecord(value.data) }
export function isPartnerSubscriptionResponse(value: unknown): value is { data: PartnerSubscriptionRecord } { return isRecord(value) && isPartnerSubscriptionRecord(value.data) }
