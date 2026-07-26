import { ChevronLeft, ChevronRight, Download, Ellipsis, Eye, ListChecks, Search } from "lucide-react"
import { useMemo, useState, type ReactElement } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type {
  KioskPaginationState,
  KioskPerformance,
  KioskSortOption,
  KioskStatus,
  KioskStatusFilter,
} from "../types/statistics.types"
import { formatDateTime, formatInteger, formatPercentage, formatRupiah } from "../utils/statistics-formatters"
import { filterAndSortKiosks, getKioskTotalPages, paginateKiosks } from "../utils/statistics-helpers"
import { StatisticsEmptyState } from "../shared/statistics-empty-state"

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "maintenance", label: "Maintenance" },
] satisfies ReadonlyArray<{ readonly value: KioskStatusFilter; readonly label: string }>

const sortOptions = [
  { value: "sessions-desc", label: "Most sessions" },
  { value: "revenue-desc", label: "Highest revenue" },
  { value: "uptime-desc", label: "Highest uptime" },
  { value: "name-asc", label: "Kiosk name" },
] satisfies ReadonlyArray<{ readonly value: KioskSortOption; readonly label: string }>

const statusLabels = {
  online: "Online",
  offline: "Offline",
  maintenance: "Maintenance",
} satisfies Record<KioskStatus, string>

const statusVariants = {
  online: "default",
  offline: "destructive",
  maintenance: "secondary",
} satisfies Record<KioskStatus, "default" | "destructive" | "secondary">

function isPageSize(value: string): value is "3" | "5" {
  return value === "3" || value === "5"
}

export function StatisticsKioskPerformance({
  kiosks,
}: {
  readonly kiosks: ReadonlyArray<KioskPerformance>
}): ReactElement {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<KioskStatusFilter>("all")
  const [sort, setSort] = useState<KioskSortOption>("sessions-desc")
  const [pagination, setPagination] = useState<KioskPaginationState>({ page: 1, pageSize: 3 })

  const filteredKiosks = useMemo(
    () => filterAndSortKiosks(kiosks, query, status, sort),
    [kiosks, query, status, sort]
  )
  const totalPages = getKioskTotalPages(filteredKiosks.length, pagination.pageSize)
  const currentPage = Math.min(pagination.page, totalPages)
  const visibleKiosks = paginateKiosks(filteredKiosks, { ...pagination, page: currentPage })

  const resetPage = (): void => setPagination((current) => ({ ...current, page: 1 }))

  const handleRowAction = (action: string, kiosk: KioskPerformance): void => {
    toast.info(action, { description: `${kiosk.name} uses dummy statistics data.` })
  }

  return (
    <section aria-labelledby="kiosk-performance-heading" className="space-y-4">
      <div>
        <h2 id="kiosk-performance-heading" className="text-xl font-semibold text-foreground">Kiosk Performance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Compare sessions, revenue, and operational uptime across locations.</p>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Label htmlFor="statistics-kiosk-search" className="sr-only">Search kiosks</Label>
          <Input
            id="statistics-kiosk-search"
            className="pl-8"
            placeholder="Search kiosk or location"
            value={query}
            onChange={(event) => { setQuery(event.target.value); resetPage() }}
          />
        </div>
        <Select<KioskStatusFilter>
          value={status}
          items={statusOptions}
          onValueChange={(value) => { if (value !== null) { setStatus(value); resetPage() } }}
        >
          <SelectTrigger className="w-full lg:w-40" aria-label="Filter kiosk status"><SelectValue /></SelectTrigger>
          <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select<KioskSortOption>
          value={sort}
          items={sortOptions}
          onValueChange={(value) => { if (value !== null) { setSort(value); resetPage() } }}
        >
          <SelectTrigger className="w-full lg:w-44" aria-label="Sort kiosk performance"><SelectValue /></SelectTrigger>
          <SelectContent>{sortOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {visibleKiosks.length === 0 ? (
        <StatisticsEmptyState title="No matching kiosks" description="Change the search term or status filter." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow><TableHead>Kiosk</TableHead><TableHead>Location</TableHead><TableHead>Sessions</TableHead><TableHead>Revenue</TableHead><TableHead>Uptime</TableHead><TableHead>Status</TableHead><TableHead>Last Active</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {visibleKiosks.map((kiosk) => (
              <TableRow key={kiosk.id}>
                <TableCell className="font-medium">{kiosk.name}</TableCell>
                <TableCell>{kiosk.location}</TableCell>
                <TableCell className="tabular-nums">{formatInteger(kiosk.sessions)}</TableCell>
                <TableCell className="tabular-nums">{formatRupiah(kiosk.revenue)}</TableCell>
                <TableCell className="tabular-nums">{formatPercentage(kiosk.uptimePercentage)}</TableCell>
                <TableCell><Badge variant={statusVariants[kiosk.status]}>{statusLabels[kiosk.status]}</Badge></TableCell>
                <TableCell><time dateTime={kiosk.lastActiveAt}>{formatDateTime(kiosk.lastActiveAt)}</time></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${kiosk.name}`} />}>
                      <Ellipsis aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRowAction("View Details", kiosk)}><Eye aria-hidden="true" /> View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRowAction("View Sessions", kiosk)}><ListChecks aria-hidden="true" /> View Sessions</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRowAction("Export Data", kiosk)}><Download aria-hidden="true" /> Export Data</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} · {filteredKiosks.length} kiosks</p>
        <div className="flex flex-wrap items-center gap-2">
          <Select<"3" | "5">
            value={String(pagination.pageSize) === "5" ? "5" : "3"}
            onValueChange={(value) => {
              if (value !== null && isPageSize(value)) setPagination({ page: 1, pageSize: Number(value) === 5 ? 5 : 3 })
            }}
          >
            <SelectTrigger className="w-28" aria-label="Kiosks per page"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="3">3 per page</SelectItem><SelectItem value="5">5 per page</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPagination((current) => ({ ...current, page: currentPage - 1 }))}>
            <ChevronLeft aria-hidden="true" /> Previous
          </Button>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPagination((current) => ({ ...current, page: currentPage + 1 }))}>
            Next <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  )
}

