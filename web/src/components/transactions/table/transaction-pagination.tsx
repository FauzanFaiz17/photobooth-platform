import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TransactionPaginationState } from "../types/transaction.types"

const pageSizes = ["10", "20", "50"] as const

function parsePageSize(value: string): TransactionPaginationState["pageSize"] | null {
  if (value === "10") return 10
  if (value === "20") return 20
  if (value === "50") return 50
  return null
}

export function TransactionPagination({
  pagination,
  totalItems,
  totalPages,
  onChange,
}: {
  readonly pagination: TransactionPaginationState
  readonly totalItems: number
  readonly totalPages: number
  readonly onChange: (pagination: TransactionPaginationState) => void
}): ReactElement {
  const start = totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(totalItems, pagination.page * pagination.pageSize)

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">Showing {start}–{end} of {totalItems} transactions · Page {pagination.page} of {totalPages}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Select<string> value={String(pagination.pageSize)} onValueChange={(value) => { if (value !== null) { const size = parsePageSize(value); if (size) onChange({ page: 1, pageSize: size }) } }}>
          <SelectTrigger className="w-32" aria-label="Transactions per page"><SelectValue /></SelectTrigger>
          <SelectContent>{pageSizes.map((size) => <SelectItem key={size} value={size}>{size} per page</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => onChange({ ...pagination, page: pagination.page - 1 })}><ChevronLeft aria-hidden="true" /> Previous</Button>
        <Button variant="outline" size="sm" disabled={pagination.page >= totalPages} onClick={() => onChange({ ...pagination, page: pagination.page + 1 })}>Next <ChevronRight aria-hidden="true" /></Button>
      </div>
    </div>
  )
}

