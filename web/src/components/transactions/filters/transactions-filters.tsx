import { Search, X } from "lucide-react"
import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type {
  PaymentMethod,
  PaymentStatus,
  TransactionDatePeriod,
  TransactionFilters,
  TransactionKiosk,
  TransactionSortField,
  TransactionSortState,
  TransactionStatus,
  SortDirection,
} from "../types/transaction.types"
import { countActiveTransactionFilters } from "../utils/transaction-helpers"

const datePeriods = [
  { value: "today", label: "Today" }, { value: "7-days", label: "Last 7 days" },
  { value: "30-days", label: "Last 30 days" }, { value: "90-days", label: "Last 90 days" },
  { value: "custom", label: "Custom range" },
] satisfies ReadonlyArray<{ readonly value: TransactionDatePeriod; readonly label: string }>

const transactionStatuses = [
  { value: "all", label: "All statuses" }, { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" }, { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" }, { value: "failed", label: "Failed" },
] satisfies ReadonlyArray<{ readonly value: TransactionStatus | "all"; readonly label: string }>

const paymentStatuses = [
  { value: "all", label: "All payments" }, { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" }, { value: "partially_refunded", label: "Partially Refunded" },
  { value: "refunded", label: "Refunded" }, { value: "failed", label: "Failed" },
] satisfies ReadonlyArray<{ readonly value: PaymentStatus | "all"; readonly label: string }>

const paymentMethods = [
  { value: "all", label: "All methods" }, { value: "qris", label: "QRIS" },
  { value: "cash", label: "Cash" }, { value: "debit_card", label: "Debit Card" },
  { value: "credit_card", label: "Credit Card" }, { value: "bank_transfer", label: "Bank Transfer" },
  { value: "e_wallet", label: "E-Wallet" },
] satisfies ReadonlyArray<{ readonly value: PaymentMethod | "all"; readonly label: string }>

interface SortOption {
  readonly value: string
  readonly label: string
  readonly field: TransactionSortField
  readonly direction: SortDirection
}

const sortOptions = [
  { value: "date-desc", label: "Newest first", field: "date", direction: "desc" },
  { value: "date-asc", label: "Oldest first", field: "date", direction: "asc" },
  { value: "amount-desc", label: "Highest amount", field: "amount", direction: "desc" },
  { value: "amount-asc", label: "Lowest amount", field: "amount", direction: "asc" },
  { value: "customer-asc", label: "Customer A–Z", field: "customer", direction: "asc" },
  { value: "status-asc", label: "Status A–Z", field: "status", direction: "asc" },
] satisfies ReadonlyArray<SortOption>

interface TransactionsFiltersProps {
  readonly filters: TransactionFilters
  readonly sort: TransactionSortState
  readonly kiosks: ReadonlyArray<TransactionKiosk>
  readonly onFiltersChange: (filters: TransactionFilters) => void
  readonly onSortChange: (sort: TransactionSortState) => void
  readonly onReset: () => void
}

export function TransactionsFilters({ filters, sort, kiosks, onFiltersChange, onSortChange, onReset }: TransactionsFiltersProps): ReactElement {
  const activeCount = countActiveTransactionFilters(filters)
  const activeSort = sortOptions.find((option) => option.field === sort.field && option.direction === sort.direction) ?? sortOptions[0]

  return (
    <section aria-label="Transaction filters" className="space-y-3 border-y border-border py-4">
      <div className="flex flex-col gap-3 xl:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Label htmlFor="transaction-search" className="sr-only">Search transactions</Label>
          <Input id="transaction-search" className="pl-8" placeholder="Search ID, customer, kiosk, or receipt" value={filters.query} onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:flex">
          <Select<TransactionDatePeriod> value={filters.datePeriod} items={datePeriods} onValueChange={(value) => value !== null && onFiltersChange({ ...filters, datePeriod: value })}>
            <SelectTrigger className="w-full xl:w-40" aria-label="Filter transaction period"><SelectValue /></SelectTrigger>
            <SelectContent>{datePeriods.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select<TransactionStatus | "all"> value={filters.transactionStatus} items={transactionStatuses} onValueChange={(value) => value !== null && onFiltersChange({ ...filters, transactionStatus: value })}>
            <SelectTrigger className="w-full xl:w-40" aria-label="Filter transaction status"><SelectValue /></SelectTrigger>
            <SelectContent>{transactionStatuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select<PaymentStatus | "all"> value={filters.paymentStatus} items={paymentStatuses} onValueChange={(value) => value !== null && onFiltersChange({ ...filters, paymentStatus: value })}>
            <SelectTrigger className="w-full xl:w-44" aria-label="Filter payment status"><SelectValue /></SelectTrigger>
            <SelectContent>{paymentStatuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select<PaymentMethod | "all"> value={filters.paymentMethod} items={paymentMethods} onValueChange={(value) => value !== null && onFiltersChange({ ...filters, paymentMethod: value })}>
            <SelectTrigger className="w-full xl:w-40" aria-label="Filter payment method"><SelectValue /></SelectTrigger>
            <SelectContent>{paymentMethods.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <Select<string> value={filters.kioskId} onValueChange={(value) => value !== null && onFiltersChange({ ...filters, kioskId: value })}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter kiosk"><SelectValue placeholder="All kiosks" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All kiosks</SelectItem>{kiosks.map((kiosk) => <SelectItem key={kiosk.id} value={kiosk.id}>{kiosk.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select<string> value={activeSort.value} onValueChange={(value) => { const option = sortOptions.find((item) => item.value === value); if (option) onSortChange({ field: option.field, direction: option.direction }) }}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Sort transactions"><SelectValue /></SelectTrigger>
          <SelectContent>{sortOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
        {filters.datePeriod === "custom" && (
          <>
            <div><Label htmlFor="transaction-date-from" className="text-xs">From</Label><Input id="transaction-date-from" type="date" value={filters.customFrom} max={filters.customTo} onChange={(event) => event.target.value && onFiltersChange({ ...filters, customFrom: event.target.value })} /></div>
            <div><Label htmlFor="transaction-date-to" className="text-xs">To</Label><Input id="transaction-date-to" type="date" value={filters.customTo} min={filters.customFrom} onChange={(event) => event.target.value && onFiltersChange({ ...filters, customTo: event.target.value })} /></div>
          </>
        )}
        {activeCount > 0 && <Badge variant="secondary">{activeCount} active filters</Badge>}
        {activeCount > 0 && <Button variant="ghost" size="sm" onClick={onReset}><X aria-hidden="true" /> Reset filters</Button>}
      </div>
    </section>
  )
}

