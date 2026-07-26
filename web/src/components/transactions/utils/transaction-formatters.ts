import type {
  PaymentMethod,
  PaymentStatus,
  RefundReason,
  TransactionStatus,
} from "../types/transaction.types"

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const integerFormatter = new Intl.NumberFormat("id-ID")

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function assertNever(value: never): never {
  throw new Error(`Unhandled transaction value: ${String(value)}`)
}

export function formatRupiah(value: number): string {
  return rupiahFormatter.format(value)
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value)
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value))
}

export function formatTime(value: string): string {
  return timeFormatter.format(new Date(value))
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value))
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case "qris": return "QRIS"
    case "cash": return "Cash"
    case "debit_card": return "Debit Card"
    case "credit_card": return "Credit Card"
    case "bank_transfer": return "Bank Transfer"
    case "e_wallet": return "E-Wallet"
    default: return assertNever(method)
  }
}

export function getTransactionStatusLabel(status: TransactionStatus): string {
  switch (status) {
    case "completed": return "Completed"
    case "processing": return "Processing"
    case "cancelled": return "Cancelled"
    case "refunded": return "Refunded"
    case "failed": return "Failed"
    default: return assertNever(status)
  }
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "paid": return "Paid"
    case "pending": return "Pending"
    case "partially_refunded": return "Partially Refunded"
    case "refunded": return "Refunded"
    case "failed": return "Failed"
    default: return assertNever(status)
  }
}

export function getRefundReasonLabel(reason: RefundReason): string {
  switch (reason) {
    case "customer_request": return "Customer request"
    case "technical_issue": return "Technical issue"
    case "duplicate_payment": return "Duplicate payment"
    case "kiosk_failure": return "Kiosk failure"
    case "session_cancelled": return "Session cancelled"
    case "other": return "Other"
    default: return assertNever(reason)
  }
}

export function getCustomerInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("id-ID"))
    .join("")
}

