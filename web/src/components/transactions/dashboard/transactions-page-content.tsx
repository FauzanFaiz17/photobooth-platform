import { useMemo, useState, type ReactElement } from "react"

import { Card, CardContent } from "@/components/ui/card"
import {
  defaultPhotoboothTransactionFilters,
  photoboothKiosks,
  photoboothTransactions,
} from "../operations/transaction-operations.data"
import { TransactionOperationsDetail } from "../operations/transaction-operations-detail"
import { TransactionOperationsFilters } from "../operations/transaction-operations-filters"
import { TransactionOperationsHeader } from "../operations/transaction-operations-header"
import { TransactionOperationsPagination } from "../operations/transaction-operations-pagination"
import {
  TransactionOperationsEmptyState,
  TransactionOperationsLoadingState,
} from "../operations/transaction-operations-states"
import { TransactionOperationsSummary } from "../operations/transaction-operations-summary"
import { TransactionOperationsTable } from "../operations/transaction-operations-table"
import type {
  PhotoboothPaginationState,
  PhotoboothTransaction,
  PhotoboothTransactionFilters,
} from "../operations/transaction-operations.types"
import {
  filterPhotoboothTransactions,
  paymentMethodLabels,
  sessionModeLabels,
  summarizePhotoboothTransactions,
} from "../operations/transaction-operations.utils"

function exportTransactions(transactions: ReadonlyArray<PhotoboothTransaction>): void {
  const rows = [
    ["ID Transaksi", "Waktu", "Kiosk", "ID Sesi", "Mode", "Metode", "Nominal", "Status"],
    ...transactions.map((transaction) => [
      transaction.id,
      transaction.occurredAt,
      transaction.kiosk.name,
      transaction.sessionId,
      sessionModeLabels[transaction.sessionMode],
      paymentMethodLabels[transaction.paymentMethod],
      String(transaction.amount),
      transaction.status,
    ]),
  ]
  const csv = rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n")
  const file = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(file)
  const link = document.createElement("a")
  link.href = url
  link.download = "transaksi-kolase-photobooth.csv"
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function TransactionsPageContent(): ReactElement {
  const [filters, setFilters] = useState<PhotoboothTransactionFilters>(
    defaultPhotoboothTransactionFilters
  )
  const [pagination, setPagination] = useState<PhotoboothPaginationState>({
    page: 1,
    pageSize: 10,
  })
  const [detailTransaction, setDetailTransaction] = useState<PhotoboothTransaction | null>(null)
  const isLoading = false

  const filteredTransactions = useMemo(
    () => filterPhotoboothTransactions(photoboothTransactions, filters),
    [filters]
  )
  const summary = useMemo(
    () => summarizePhotoboothTransactions(filteredTransactions),
    [filteredTransactions]
  )
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pagination.pageSize))
  const currentPagination = pagination.page > totalPages
    ? { ...pagination, page: totalPages }
    : pagination
  const visibleTransactions = filteredTransactions.slice(
    (currentPagination.page - 1) * currentPagination.pageSize,
    currentPagination.page * currentPagination.pageSize
  )

  const handleFiltersChange = (nextFilters: PhotoboothTransactionFilters): void => {
    setFilters(nextFilters)
    setPagination((current) => ({ ...current, page: 1 }))
  }

  if (isLoading) return <TransactionOperationsLoadingState />

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <TransactionOperationsHeader
        selectedDate={filters.dateTo}
        onDateChange={(dateTo) => handleFiltersChange({ ...filters, dateTo })}
        onExport={() => exportTransactions(filteredTransactions)}
      />

      <TransactionOperationsSummary summary={summary} />

      <TransactionOperationsFilters
        filters={filters}
        kiosks={photoboothKiosks}
        onChange={handleFiltersChange}
      />

      {visibleTransactions.length > 0 ? (
        <Card className="min-w-0 shadow-none">
          <CardContent className="space-y-4 px-0">
            <TransactionOperationsTable
              transactions={visibleTransactions}
              onViewDetail={setDetailTransaction}
            />
            <div className="px-4">
              <TransactionOperationsPagination
                pagination={currentPagination}
                totalItems={filteredTransactions.length}
                totalPages={totalPages}
                onChange={setPagination}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <TransactionOperationsEmptyState
          onReset={() => handleFiltersChange(defaultPhotoboothTransactionFilters)}
        />
      )}

      <TransactionOperationsDetail
        transaction={detailTransaction}
        open={detailTransaction !== null}
        onOpenChange={(open) => {
          if (!open) setDetailTransaction(null)
        }}
      />
    </div>
  )
}
