export type KioskVoucherStatus = "unused" | "used" | "expired" | "inactive"
export type KioskVoucherType = "free-session" | "discount" | "nominal"

export interface VoucherKioskSummary {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly totalVouchers: number
}

export interface KioskVoucher {
  readonly id: string
  readonly kioskId: string
  readonly name: string
  readonly type: KioskVoucherType
  readonly value: number
  readonly code: string
  readonly printCount: number
  readonly usageLimit: number
  readonly usedCount: number
  readonly createdAt: string
  readonly startsAt: string
  readonly expiresAt: string
  readonly status: KioskVoucherStatus
}

export interface VoucherDetailFilters {
  readonly status: KioskVoucherStatus | "all"
  readonly type: KioskVoucherType | "all"
  readonly nameQuery: string
  readonly codeQuery: string
  readonly createdDate: string
}

export interface VoucherFormValues {
  readonly name: string
  readonly type: KioskVoucherType
  readonly value: string
  readonly code: string
  readonly kioskId: string
  readonly quantity: string
  readonly printCount: string
  readonly usageLimit: string
  readonly startDate: string
  readonly expirationDate: string
  readonly active: boolean
}

export type VoucherFormErrors = Partial<Record<keyof VoucherFormValues, string>>
