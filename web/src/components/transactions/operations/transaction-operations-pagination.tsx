import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PhotoboothPaginationState } from "./transaction-operations.types"

const pageSizes: ReadonlyArray<PhotoboothPaginationState["pageSize"]> = [5, 10, 20]

function parsePageSize(value: string): PhotoboothPaginationState["pageSize"] | null {
  const numberValue = Number(value)
  return numberValue === 5 || numberValue === 10 || numberValue === 20 ? numberValue : null
}

export function TransactionOperationsPagination({
  pagination,
  totalItems,
  totalPages,
  onChange,
}: {
  readonly pagination: PhotoboothPaginationState
  readonly totalItems: number
  readonly totalPages: number
  readonly onChange: (pagination: PhotoboothPaginationState) => void
}): ReactElement {
  const start = totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(pagination.page * pagination.pageSize, totalItems)

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm tabular-nums opacity-70">
        Menampilkan {start} – {end} dari {totalItems} transaksi
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Select<string>
          value={String(pagination.pageSize)}
          onValueChange={(value) => {
            if (!value) return
            const pageSize = parsePageSize(value)
            if (pageSize) onChange({ page: 1, pageSize })
          }}
        >
          <SelectTrigger className="w-36" aria-label="Jumlah baris per halaman"><SelectValue /></SelectTrigger>
          <SelectContent>
            {pageSizes.map((pageSize) => (
              <SelectItem key={pageSize} value={String(pageSize)}>{pageSize} baris</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page <= 1}
          onClick={() => onChange({ ...pagination, page: pagination.page - 1 })}
        >
          <ChevronLeft aria-hidden="true" />
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page >= totalPages}
          onClick={() => onChange({ ...pagination, page: pagination.page + 1 })}
        >
          Berikutnya
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
