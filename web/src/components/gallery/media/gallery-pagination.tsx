import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { GalleryPaginationState } from "../types/gallery.types"

const pageSizes = [12, 24, 48] satisfies ReadonlyArray<GalleryPaginationState["pageSize"]>

export function GalleryPagination({ pagination, totalItems, totalPages, onChange }: { readonly pagination: GalleryPaginationState; readonly totalItems: number; readonly totalPages: number; readonly onChange: (value: GalleryPaginationState) => void }): ReactElement {
  return (
    <nav aria-label="Gallery pagination" className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">Page {pagination.page} of {totalPages} · {totalItems} items</p>
      <div className="flex items-center gap-2"><Select<GalleryPaginationState["pageSize"]> value={pagination.pageSize} items={pageSizes.map((value) => ({ value, label: String(value) }))} onValueChange={(value) => value !== null && onChange({ page: 1, pageSize: value })}><SelectTrigger aria-label="Items per page"><SelectValue /></SelectTrigger><SelectContent>{pageSizes.map((size) => <SelectItem key={size} value={size}>{size} per page</SelectItem>)}</SelectContent></Select><Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={pagination.page <= 1} onClick={() => onChange({ ...pagination, page: pagination.page - 1 })}><ChevronLeft aria-hidden="true" /></Button><Button variant="outline" size="icon-sm" aria-label="Next page" disabled={pagination.page >= totalPages} onClick={() => onChange({ ...pagination, page: pagination.page + 1 })}><ChevronRight aria-hidden="true" /></Button></div>
    </nav>
  )
}
