export type PhotoboothTransactionStatus =
  | "success"
  | "pending"
  | "failed"
  | "expired"
  | "voucher"
  | "free"

export type PhotoboothSessionMode = "paid" | "voucher" | "free"

export type PhotoboothPaymentMethod =
  | "qris"
  | "bank-transfer"
  | "e-wallet"
  | "debit-card"
  | "credit-card"
  | "cash"
  | "none"

export interface PhotoboothKioskOption {
  readonly id: string
  readonly name: string
}

export interface PhotoboothTransaction {
  readonly id: string
  readonly occurredAt: string
  readonly kiosk: PhotoboothKioskOption
  readonly sessionId: string
  readonly sessionMode: PhotoboothSessionMode
  readonly paymentMethod: PhotoboothPaymentMethod
  readonly amount: number
  readonly status: PhotoboothTransactionStatus
  readonly paymentReference: string | null
  readonly paymentGateway: string | null
  readonly voucherCode: string | null
}

export interface PhotoboothTransactionFilters {
  readonly query: string
  readonly dateFrom: string
  readonly dateTo: string
  readonly kioskId: string | "all"
  readonly status: PhotoboothTransactionStatus | "all"
  readonly sessionMode: PhotoboothSessionMode | "all"
  readonly paymentMethod: PhotoboothPaymentMethod | "all"
}

export interface PhotoboothTransactionSummary {
  readonly revenue: number
  readonly successful: number
  readonly pending: number
  readonly failed: number
  readonly voucherSessions: number
}

export interface PhotoboothPaginationState {
  readonly page: number
  readonly pageSize: 5 | 10 | 20
}
