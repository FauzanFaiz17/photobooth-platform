import type {
  PhotoboothPaymentMethod,
  PhotoboothSessionMode,
  PhotoboothTransaction,
  PhotoboothTransactionFilters,
  PhotoboothTransactionSummary,
} from "./transaction-operations.types"

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export const sessionModeLabels: Record<PhotoboothSessionMode, string> = {
  paid: "Paid",
  voucher: "Voucher",
  free: "Free",
}

export const paymentMethodLabels: Record<PhotoboothPaymentMethod, string> = {
  qris: "QRIS",
  "bank-transfer": "Transfer Bank",
  "e-wallet": "E-Wallet",
  "debit-card": "Kartu Debit",
  "credit-card": "Kartu Kredit",
  cash: "Tunai",
  none: "–",
}

export function formatTransactionDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value))
}

export function formatTransactionCurrency(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`
}

export function filterPhotoboothTransactions(
  transactions: ReadonlyArray<PhotoboothTransaction>,
  filters: PhotoboothTransactionFilters
): ReadonlyArray<PhotoboothTransaction> {
  const query = filters.query.trim().toLocaleLowerCase("id-ID")
  return transactions.filter((transaction) => {
    const transactionDate = transaction.occurredAt.slice(0, 10)
    if (query && !transaction.id.toLocaleLowerCase("id-ID").includes(query) && !transaction.kiosk.name.toLocaleLowerCase("id-ID").includes(query)) return false
    if (transactionDate < filters.dateFrom || transactionDate > filters.dateTo) return false
    if (filters.kioskId !== "all" && transaction.kiosk.id !== filters.kioskId) return false
    if (filters.status !== "all" && transaction.status !== filters.status) return false
    if (filters.sessionMode !== "all" && transaction.sessionMode !== filters.sessionMode) return false
    if (filters.paymentMethod !== "all" && transaction.paymentMethod !== filters.paymentMethod) return false
    return true
  })
}

export function summarizePhotoboothTransactions(
  transactions: ReadonlyArray<PhotoboothTransaction>
): PhotoboothTransactionSummary {
  return {
    revenue: transactions
      .filter((transaction) => transaction.status === "success")
      .reduce((sum, transaction) => sum + transaction.amount, 0),
    successful: transactions.filter((transaction) => transaction.status === "success").length,
    pending: transactions.filter((transaction) => transaction.status === "pending").length,
    failed: transactions.filter((transaction) => transaction.status === "failed" || transaction.status === "expired").length,
    voucherSessions: transactions.filter((transaction) => transaction.sessionMode === "voucher").length,
  }
}
