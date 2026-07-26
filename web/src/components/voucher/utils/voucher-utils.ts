import { voucherKiosks, voucherPackages, voucherReferenceTime } from "../data/voucher-data"
import type {
  Voucher,
  VoucherBenefit,
  VoucherDisableReason,
  VoucherEffectiveStatus,
  VoucherFilters,
  VoucherRedemptionResult,
  VoucherValidationInput,
  VoucherValidationResult,
} from "../types/voucher.types"

const currencyFormatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat("id-ID")
const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" })
const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })

export function formatVoucherCurrency(value: number): string { return currencyFormatter.format(value) }
export function formatVoucherNumber(value: number): string { return numberFormatter.format(value) }
export function formatVoucherDate(value: string): string { return dateFormatter.format(new Date(value)) }
export function formatVoucherDateTime(value: string): string { return dateTimeFormatter.format(new Date(value)) }

export function getVoucherEffectiveStatus(voucher: Voucher, now = voucherReferenceTime): VoucherEffectiveStatus {
  if (voucher.storedStatus === "disabled") return "disabled"
  if (new Date(now).getTime() < new Date(voucher.startsAt).getTime()) return "scheduled"
  if (voucher.expiresAt && new Date(now).getTime() > new Date(voucher.expiresAt).getTime()) return "expired"
  if (voucher.redemptionCount >= voucher.maximumRedemptions) return "redeemed"
  if (voucher.redemptionCount > 0) return "partially_used"
  return "active"
}

export function getRemainingRedemptions(voucher: Voucher): number {
  return Math.max(0, voucher.maximumRedemptions - voucher.redemptionCount)
}

export function getVoucherStatusLabel(status: VoucherEffectiveStatus): string {
  switch (status) {
    case "active": return "Active"
    case "scheduled": return "Scheduled"
    case "redeemed": return "Redeemed"
    case "partially_used": return "Partially Used"
    case "expired": return "Expired"
    case "disabled": return "Disabled"
  }
}

export function getVoucherBenefitLabel(benefit: VoucherBenefit): string {
  switch (benefit.type) {
    case "free_session": return "Free Session"
    case "fixed_credit": return `${formatVoucherCurrency(benefit.amount)} Credit`
    case "percentage_discount": return `${benefit.percentage}% Discount`
    case "fixed_discount": return `${formatVoucherCurrency(benefit.amount)} Discount`
  }
}

export function getVoucherBenefitDescription(benefit: VoucherBenefit): string {
  switch (benefit.type) {
    case "free_session": return benefit.maximumCoveredAmount ? `Covers up to ${formatVoucherCurrency(benefit.maximumCoveredAmount)}` : "Covers one complete session"
    case "fixed_credit": return `Credit value ${formatVoucherCurrency(benefit.amount)}`
    case "percentage_discount": return benefit.maximumDiscountAmount ? `Maximum discount ${formatVoucherCurrency(benefit.maximumDiscountAmount)}` : "No maximum discount"
    case "fixed_discount": return benefit.minimumTransactionAmount ? `Minimum purchase ${formatVoucherCurrency(benefit.minimumTransactionAmount)}` : "No minimum purchase"
  }
}

export function getRedemptionResultLabel(result: VoucherRedemptionResult): string {
  switch (result) {
    case "redeemed": return "Redeemed"
    case "rejected": return "Rejected"
    case "reversed": return "Reversed"
  }
}

export function getDisableReasonLabel(reason: VoucherDisableReason): string {
  switch (reason) {
    case "campaign_ended": return "Campaign ended"
    case "suspected_misuse": return "Suspected misuse"
    case "created_by_mistake": return "Created by mistake"
    case "customer_request": return "Customer request"
    case "operational_issue": return "Operational issue"
    case "other": return "Other"
  }
}

function matchesAssignment(assignment: ReadonlyArray<string> | "all", id: string): boolean {
  return assignment === "all" || assignment.includes(id)
}

export function validateVoucher(input: VoucherValidationInput, vouchers: ReadonlyArray<Voucher>): VoucherValidationResult {
  const normalizedCode = input.code.trim().toUpperCase()
  const voucher = vouchers.find((item) => item.code === normalizedCode)
  if (!voucher) return { valid: false, reason: "Code not found" }
  const status = getVoucherEffectiveStatus(voucher)
  if (status === "disabled") return { valid: false, reason: "Voucher disabled" }
  if (status === "expired") return { valid: false, reason: "Voucher has expired" }
  if (status === "scheduled") return { valid: false, reason: "Voucher is not active yet" }
  if (status === "redeemed") return { valid: false, reason: "Voucher has already been fully redeemed" }
  if (!matchesAssignment(voucher.applicableKioskIds, input.kioskId)) return { valid: false, reason: "Voucher is not valid at this kiosk" }
  if (!matchesAssignment(voucher.applicablePackageIds, input.packageId)) return { valid: false, reason: "Voucher is not valid for this package" }
  if (voucher.requireCustomerIdentifier && !input.customerIdentifier.trim()) return { valid: false, reason: "Customer identifier is required" }
  if (voucher.maximumRedemptionsPerCustomer && input.customerIdentifier.trim()) {
    const customerUses = voucher.redemptions.filter((item) => item.result === "redeemed" && item.customerReference === input.customerIdentifier.trim()).length
    if (customerUses >= voucher.maximumRedemptionsPerCustomer) return { valid: false, reason: "Customer redemption limit reached" }
  }
  return { valid: true, voucher, remainingRedemptions: getRemainingRedemptions(voucher) }
}

function getSearchText(voucher: Voucher): string {
  const kioskNames = voucher.applicableKioskIds === "all" ? "all kiosks" : voucherKiosks.filter((item) => voucher.applicableKioskIds !== "all" && voucher.applicableKioskIds.includes(item.id)).map((item) => item.name).join(" ")
  const packageNames = voucher.applicablePackageIds === "all" ? "all packages" : voucherPackages.filter((item) => voucher.applicablePackageIds !== "all" && voucher.applicablePackageIds.includes(item.id)).map((item) => item.name).join(" ")
  return [voucher.code, voucher.name, voucher.prefix ?? "", voucher.tags.join(" "), kioskNames, packageNames].join(" ").toLowerCase()
}

export function filterVouchers(items: ReadonlyArray<Voucher>, filters: VoucherFilters): Voucher[] {
  const now = new Date(voucherReferenceTime).getTime()
  const day = 86_400_000
  return items.filter((voucher) => {
    if (filters.query.trim() && !getSearchText(voucher).includes(filters.query.trim().toLowerCase())) return false
    if (filters.status !== "all" && getVoucherEffectiveStatus(voucher) !== filters.status) return false
    if (filters.benefit !== "all" && voucher.benefit.type !== filters.benefit) return false
    if (filters.kioskId !== "all" && !matchesAssignment(voucher.applicableKioskIds, filters.kioskId)) return false
    if (filters.expiration === "no_expiration" && voucher.expiresAt !== null) return false
    if (filters.expiration === "expired" && getVoucherEffectiveStatus(voucher) !== "expired") return false
    if (filters.expiration === "within_7_days" || filters.expiration === "within_30_days") {
      if (!voucher.expiresAt) return false
      const difference = new Date(voucher.expiresAt).getTime() - now
      const limit = filters.expiration === "within_7_days" ? 7 * day : 30 * day
      if (difference < 0 || difference > limit) return false
    }
    return true
  })
}

export function sortVouchers(items: ReadonlyArray<Voucher>, sort: VoucherFilters["sort"]): Voucher[] {
  return [...items].sort((left, right) => {
    switch (sort) {
      case "newest": return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      case "oldest": return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      case "expiration_soonest": return (left.expiresAt ? new Date(left.expiresAt).getTime() : Number.MAX_SAFE_INTEGER) - (right.expiresAt ? new Date(right.expiresAt).getTime() : Number.MAX_SAFE_INTEGER)
      case "most_redeemed": return right.redemptionCount - left.redemptionCount
      case "least_redeemed": return left.redemptionCount - right.redemptionCount
      case "code_asc": return left.code.localeCompare(right.code)
    }
  })
}

export function countActiveVoucherFilters(filters: VoucherFilters): number {
  return Number(Boolean(filters.query.trim())) + Number(filters.status !== "all") + Number(filters.benefit !== "all") + Number(filters.kioskId !== "all") + Number(filters.expiration !== "all")
}

export function canEnableVoucher(voucher: Voucher): boolean {
  const enabledVoucher: Voucher = { ...voucher, storedStatus: "enabled" }
  const status = getVoucherEffectiveStatus(enabledVoucher)
  return status !== "expired" && status !== "redeemed"
}

export async function copyVoucherText(text: string): Promise<boolean> {
  if (!navigator.clipboard) return false
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}
