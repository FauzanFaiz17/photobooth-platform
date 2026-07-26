import { defaultTransactionFilters } from "../data/transactions-data"
import type {
  Transaction,
  TransactionFilters,
  TransactionPaginationState,
  TransactionSortState,
} from "../types/transaction.types"
import { getTransactionStatusLabel } from "./transaction-formatters"

const REFERENCE_DATE = "2026-07-15"

function getPeriodStartDate(period: TransactionFilters["datePeriod"]): string | null {
  if (period === "today") return REFERENCE_DATE
  if (period === "custom") return null
  const days = period === "7-days" ? 7 : period === "30-days" ? 30 : 90
  const start = new Date(`${REFERENCE_DATE}T00:00:00+07:00`)
  start.setDate(start.getDate() - (days - 1))
  return start.toISOString().slice(0, 10)
}

export function filterTransactions(
  items: ReadonlyArray<Transaction>,
  filters: TransactionFilters
): ReadonlyArray<Transaction> {
  const query = filters.query.trim().toLocaleLowerCase("id-ID")
  const periodStart = getPeriodStartDate(filters.datePeriod)

  return items.filter((transaction) => {
    const createdDate = transaction.createdAt.slice(0, 10)
    const matchesQuery = query.length === 0 || [
      transaction.id,
      transaction.receiptNumber,
      transaction.customer.name,
      transaction.customer.email,
      transaction.kiosk.name,
    ].some((value) => value.toLocaleLowerCase("id-ID").includes(query))
    const matchesPeriod = filters.datePeriod === "custom"
      ? createdDate >= filters.customFrom && createdDate <= filters.customTo
      : periodStart === null || (createdDate >= periodStart && createdDate <= REFERENCE_DATE)

    return matchesQuery &&
      matchesPeriod &&
      (filters.transactionStatus === "all" || transaction.transactionStatus === filters.transactionStatus) &&
      (filters.paymentStatus === "all" || transaction.paymentStatus === filters.paymentStatus) &&
      (filters.paymentMethod === "all" || transaction.paymentMethod === filters.paymentMethod) &&
      (filters.kioskId === "all" || transaction.kiosk.id === filters.kioskId)
  })
}

export function sortTransactions(
  items: ReadonlyArray<Transaction>,
  sort: TransactionSortState
): ReadonlyArray<Transaction> {
  const direction = sort.direction === "asc" ? 1 : -1

  return [...items].sort((first, second) => {
    if (sort.field === "date") return first.createdAt.localeCompare(second.createdAt) * direction
    if (sort.field === "amount") return (first.total - second.total) * direction
    if (sort.field === "customer") return first.customer.name.localeCompare(second.customer.name, "id-ID") * direction
    return getTransactionStatusLabel(first.transactionStatus).localeCompare(getTransactionStatusLabel(second.transactionStatus), "en-US") * direction
  })
}

export function paginateTransactions(
  items: ReadonlyArray<Transaction>,
  pagination: TransactionPaginationState
): ReadonlyArray<Transaction> {
  const start = (pagination.page - 1) * pagination.pageSize
  return items.slice(start, start + pagination.pageSize)
}

export function getTransactionTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function countActiveTransactionFilters(filters: TransactionFilters): number {
  let count = 0
  if (filters.query.trim()) count += 1
  if (filters.datePeriod !== defaultTransactionFilters.datePeriod) count += 1
  if (filters.transactionStatus !== "all") count += 1
  if (filters.paymentStatus !== "all") count += 1
  if (filters.paymentMethod !== "all") count += 1
  if (filters.kioskId !== "all") count += 1
  return count
}

export function getRemainingRefundableAmount(transaction: Transaction): number {
  return Math.max(0, transaction.paidAmount - transaction.refundedAmount)
}

export async function copyTransactionId(id: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false
  try {
    await navigator.clipboard.writeText(id)
    return true
  } catch {
    return false
  }
}

