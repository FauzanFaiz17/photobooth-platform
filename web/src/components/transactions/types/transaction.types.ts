export type TransactionStatus = "completed" | "processing" | "cancelled" | "refunded" | "failed"

export type PaymentStatus = "paid" | "pending" | "partially_refunded" | "refunded" | "failed"

export type PaymentMethod = "qris" | "cash" | "debit_card" | "credit_card" | "bank_transfer" | "e_wallet"

export type RefundType = "full" | "partial"

export type RefundReason = "customer_request" | "technical_issue" | "duplicate_payment" | "kiosk_failure" | "session_cancelled" | "other"

export type TransactionSortField = "date" | "amount" | "customer" | "status"

export type SortDirection = "asc" | "desc"

export type TransactionDatePeriod = "today" | "7-days" | "30-days" | "90-days" | "custom"

export interface TransactionCustomer {
  readonly name: string
  readonly email: string
  readonly phone: string
}

export interface TransactionKiosk {
  readonly id: string
  readonly name: string
  readonly location: string
}

export interface TransactionItem {
  readonly id: string
  readonly name: string
  readonly category: "package" | "add-on"
  readonly quantity: number
  readonly unitPrice: number
}

export interface TransactionRefund {
  readonly type: RefundType
  readonly amount: number
  readonly reason: RefundReason
  readonly internalNote: string
  readonly refundedAt: string
}

export type TransactionActivityType = "created" | "payment_initiated" | "payment_confirmed" | "session_completed" | "refund_requested" | "refund_completed" | "cancelled" | "failed"

export interface TransactionActivity {
  readonly id: string
  readonly type: TransactionActivityType
  readonly title: string
  readonly description: string
  readonly occurredAt: string
}

export interface Transaction {
  readonly id: string
  readonly receiptNumber: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly customer: TransactionCustomer
  readonly kiosk: TransactionKiosk
  readonly items: ReadonlyArray<TransactionItem>
  readonly subtotal: number
  readonly discount: number
  readonly tax: number
  readonly total: number
  readonly paidAmount: number
  readonly refundedAmount: number
  readonly paymentMethod: PaymentMethod
  readonly paymentStatus: PaymentStatus
  readonly transactionStatus: TransactionStatus
  readonly paymentReference: string | null
  readonly paidAt: string | null
  readonly refund: TransactionRefund | null
  readonly activities: ReadonlyArray<TransactionActivity>
}

export interface TransactionFilters {
  readonly query: string
  readonly datePeriod: TransactionDatePeriod
  readonly customFrom: string
  readonly customTo: string
  readonly transactionStatus: TransactionStatus | "all"
  readonly paymentStatus: PaymentStatus | "all"
  readonly paymentMethod: PaymentMethod | "all"
  readonly kioskId: string | "all"
}

export interface TransactionSortState {
  readonly field: TransactionSortField
  readonly direction: SortDirection
}

export interface TransactionPaginationState {
  readonly page: number
  readonly pageSize: 10 | 20 | 50
}

export interface TransactionSummary {
  readonly grossRevenue: number
  readonly grossRevenueChange: number
  readonly successfulTransactions: number
  readonly successfulTransactionsChange: number
  readonly pendingPayments: number
  readonly pendingPaymentsChange: number
  readonly refundedAmount: number
  readonly refundCount: number
}

export interface CreateTransactionValues {
  readonly customerName: string
  readonly kioskId: string
  readonly packageId: string
  readonly paymentMethod: PaymentMethod
  readonly amount: string
}

export interface RefundFormValues {
  readonly type: RefundType
  readonly amount: string
  readonly reason: RefundReason
  readonly internalNote: string
}

export type TransactionConfirmationAction = "complete" | "cancel"

