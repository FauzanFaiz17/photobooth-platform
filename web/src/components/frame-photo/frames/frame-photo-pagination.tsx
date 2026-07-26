import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PhotoFramePaginationState, PhotoFrameViewMode } from "../types/frame-photo.types"

function parsePageSize(value: string): PhotoFramePaginationState["pageSize"] | null {
  if (value === "10") return 10
  if (value === "12") return 12
  if (value === "24") return 24
  if (value === "48") return 48
  return null
}

export function FramePhotoPagination({ pagination, totalItems, totalPages, view, onChange }: { readonly pagination: PhotoFramePaginationState; readonly totalItems: number; readonly totalPages: number; readonly view: PhotoFrameViewMode; readonly onChange: (pagination: PhotoFramePaginationState) => void }): ReactElement {
  const sizes = view === "grid" ? ["12", "24", "48"] : ["10", "24", "48"]
  const start = totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(totalItems, pagination.page * pagination.pageSize)
  return <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Showing {start}–{end} of {totalItems} frames · Page {pagination.page} of {totalPages}</p><div className="flex flex-wrap gap-2"><Select<string> value={String(pagination.pageSize)} onValueChange={(value) => { if (value !== null) { const size = parsePageSize(value); if (size) onChange({ page: 1, pageSize: size }) } }}><SelectTrigger className="w-28" aria-label="Frames per page"><SelectValue /></SelectTrigger><SelectContent>{sizes.map((size) => <SelectItem key={size} value={size}>{size} per page</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => onChange({ ...pagination, page: pagination.page - 1 })}><ChevronLeft aria-hidden="true" /> Previous</Button><Button variant="outline" size="sm" disabled={pagination.page >= totalPages} onClick={() => onChange({ ...pagination, page: pagination.page + 1 })}>Next <ChevronRight aria-hidden="true" /></Button></div></div>
}

