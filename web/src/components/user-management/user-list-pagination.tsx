import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PaginationMeta } from "@/features/users/user.types"

const pageSizes = [5, 10, 25, 50, 100] as const

function parsePageSize(value: string): number | null {
  const pageSize = pageSizes.find((size) => String(size) === value)
  return pageSize ?? null
}

function createPageNumbers(
  currentPage: number,
  totalPages: number
): ReadonlyArray<number> {
  const visibleCount = Math.min(5, totalPages)
  const maximumStart = Math.max(1, totalPages - visibleCount + 1)
  const start = Math.min(
    Math.max(1, currentPage - Math.floor(visibleCount / 2)),
    maximumStart
  )

  return Array.from({ length: visibleCount }, (_, index) => start + index)
}

interface UserListPaginationProps {
  readonly meta: PaginationMeta
  readonly onPageChange: (page: number) => void
  readonly onPageSizeChange: (pageSize: number) => void
}

export function UserListPagination({
  meta,
  onPageChange,
  onPageSizeChange,
}: UserListPaginationProps) {
  const totalPages = Math.max(1, meta.last_page)
  const currentPage = Math.min(Math.max(1, meta.current_page), totalPages)
  const pageNumbers = createPageNumbers(currentPage, totalPages)

  return (
    <div className="flex flex-col gap-3 border-t px-4 pt-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm tabular-nums text-muted-foreground">
        {meta.from ?? 0}–{meta.to ?? 0} dari {meta.total} user
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Select<string>
          value={String(meta.per_page)}
          onValueChange={(value) => {
            if (value === null) return
            const pageSize = parsePageSize(value)
            if (pageSize !== null) onPageSizeChange(pageSize)
          }}
        >
          <SelectTrigger className="w-32" aria-label="Jumlah user per halaman">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizes.map((pageSize) => (
              <SelectItem key={pageSize} value={String(pageSize)}>
                {pageSize} per halaman
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" />
          Sebelumnya
        </Button>

        <div className="hidden items-center gap-1 md:flex">
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === currentPage ? "default" : "ghost"}
              size="icon-sm"
              aria-label={`Halaman ${pageNumber}`}
              aria-current={pageNumber === currentPage ? "page" : undefined}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Berikutnya
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
