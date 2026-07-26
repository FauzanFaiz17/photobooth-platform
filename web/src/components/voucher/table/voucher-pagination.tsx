import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { VoucherPaginationState } from "../types/voucher.types"

interface VoucherPaginationProps { readonly pagination: VoucherPaginationState; readonly totalItems: number; readonly onChange: (value: VoucherPaginationState) => void }
const sizes = [20, 50, 100] as const
function parseSize(value: string): VoucherPaginationState["pageSize"] | null { const found = sizes.find((size) => String(size) === value); return found ?? null }

export function VoucherPagination({ pagination, totalItems, onChange }: VoucherPaginationProps) {
  const pages = Math.max(1, Math.ceil(totalItems / pagination.pageSize)); const start = totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1; const end = Math.min(totalItems, pagination.page * pagination.pageSize)
  return <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Showing {start}–{end} of {totalItems} vouchers · Page {pagination.page} of {pages}</p><div className="flex flex-wrap gap-2"><Select<string> value={String(pagination.pageSize)} onValueChange={(value) => { if (value !== null) { const size = parseSize(value); if (size) onChange({ page: 1, pageSize: size }) } }}><SelectTrigger className="w-32" aria-label="Vouchers per page"><SelectValue /></SelectTrigger><SelectContent>{sizes.map((size) => <SelectItem key={size} value={String(size)}>{size} per page</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => onChange({ ...pagination, page: pagination.page - 1 })}><ChevronLeft aria-hidden="true" /> Previous</Button><Button variant="outline" size="sm" disabled={pagination.page >= pages} onClick={() => onChange({ ...pagination, page: pagination.page + 1 })}>Next <ChevronRight aria-hidden="true" /></Button></div></div>
}
