export type VoucherBenefitType = "free_session" | "fixed_credit" | "percentage_discount" | "fixed_discount"
export type VoucherStoredStatus = "enabled" | "disabled"
export type VoucherEffectiveStatus = "active" | "scheduled" | "redeemed" | "partially_used" | "expired" | "disabled"
export type VoucherRedemptionResult = "redeemed" | "rejected" | "reversed"
export type VoucherGenerationMode = "single" | "batch"
export type VoucherAssignmentScope = "all" | "selected"
export type VoucherInitialStatus = "activate" | "scheduled" | "disabled"
export type VoucherExpirationFilter = "all" | "within_7_days" | "within_30_days" | "no_expiration" | "expired"
export type VoucherSortOption = "newest" | "oldest" | "expiration_soonest" | "most_redeemed" | "least_redeemed" | "code_asc"
export type VoucherDisableReason = "campaign_ended" | "suspected_misuse" | "created_by_mistake" | "customer_request" | "operational_issue" | "other"

export type VoucherBenefit =
  | { readonly type: "free_session"; readonly maximumCoveredAmount: number | null }
  | { readonly type: "fixed_credit"; readonly amount: number }
  | { readonly type: "percentage_discount"; readonly percentage: number; readonly maximumDiscountAmount: number | null }
  | { readonly type: "fixed_discount"; readonly amount: number; readonly minimumTransactionAmount: number | null }

export interface VoucherRedemption {
  readonly id: string
  readonly occurredAt: string
  readonly kioskId: string
  readonly sessionId: string
  readonly customerReference: string
  readonly result: VoucherRedemptionResult
  readonly value: number
  readonly notes: string
}

export interface Voucher {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly description: string
  readonly prefix: string | null
  readonly batchId: string | null
  readonly benefit: VoucherBenefit
  readonly storedStatus: VoucherStoredStatus
  readonly startsAt: string
  readonly expiresAt: string | null
  readonly maximumRedemptions: number
  readonly redemptionCount: number
  readonly maximumRedemptionsPerCustomer: number | null
  readonly oneRedemptionPerSession: boolean
  readonly allowMultipleUses: boolean
  readonly requireCustomerIdentifier: boolean
  readonly applicableKioskIds: ReadonlyArray<string> | "all"
  readonly applicablePackageIds: ReadonlyArray<string> | "all"
  readonly tags: ReadonlyArray<string>
  readonly internalNote: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly createdBy: string
  readonly redemptions: ReadonlyArray<VoucherRedemption>
}

export interface VoucherFilters {
  readonly query: string
  readonly status: VoucherEffectiveStatus | "all"
  readonly benefit: VoucherBenefitType | "all"
  readonly kioskId: string | "all"
  readonly expiration: VoucherExpirationFilter
  readonly sort: VoucherSortOption
}

export interface VoucherPaginationState {
  readonly page: number
  readonly pageSize: 20 | 50 | 100
}

export interface VoucherSummary {
  readonly activeVouchers: number
  readonly generatedThisMonth: number
  readonly redeemedVouchers: number
  readonly redemptionRate: number
  readonly expiringSoon: number
  readonly voucherSessions: number
  readonly equivalentValue: number
}

export interface VoucherGenerateFormValues {
  readonly mode: VoucherGenerationMode
  readonly name: string
  readonly description: string
  readonly prefix: string
  readonly codeLength: 8 | 10 | 12
  readonly quantity: string
  readonly customCode: string
  readonly benefitType: VoucherBenefitType
  readonly maximumCoveredAmount: string
  readonly creditAmount: string
  readonly discountPercentage: string
  readonly maximumDiscountAmount: string
  readonly fixedDiscountAmount: string
  readonly minimumTransactionAmount: string
  readonly startDate: string
  readonly startTime: string
  readonly expirationDate: string
  readonly expirationTime: string
  readonly noExpiration: boolean
  readonly maximumRedemptions: string
  readonly maximumRedemptionsPerCustomer: string
  readonly oneRedemptionPerSession: boolean
  readonly allowMultipleUses: boolean
  readonly requireCustomerIdentifier: boolean
  readonly packageScope: VoucherAssignmentScope
  readonly packageIds: ReadonlyArray<string>
  readonly kioskScope: VoucherAssignmentScope
  readonly kioskIds: ReadonlyArray<string>
  readonly initialStatus: VoucherInitialStatus
  readonly tags: string
  readonly internalNote: string
}

export interface VoucherGenerationResult {
  readonly name: string
  readonly vouchers: ReadonlyArray<Voucher>
}

export interface VoucherValidationInput {
  readonly code: string
  readonly kioskId: string
  readonly packageId: string
  readonly customerIdentifier: string
}

export type VoucherValidationResult =
  | { readonly valid: true; readonly voucher: Voucher; readonly remainingRedemptions: number }
  | { readonly valid: false; readonly reason: string }

export interface VoucherExtendValues {
  readonly expirationDate: string
  readonly expirationTime: string
  readonly reason: string
  readonly internalNote: string
}

