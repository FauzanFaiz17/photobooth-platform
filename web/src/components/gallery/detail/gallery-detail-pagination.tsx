import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"

interface GalleryDetailPaginationProps {
  readonly page: number
  readonly totalPages: number
  readonly totalItems: number
  readonly pageSize: number
  readonly onPageChange: (page: number) => void
}

export function GalleryDetailPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: GalleryDetailPaginationProps): ReactElement {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm tabular-nums opacity-70">
        {start} – {end} dari {totalItems} foto
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
          Sebelumnya
        </Button>
        <Button size="icon" aria-label={`Halaman ${page}`}>{page}</Button>
        <Button
          variant="ghost"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
