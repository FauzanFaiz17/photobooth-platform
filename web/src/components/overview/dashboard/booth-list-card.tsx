import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"
import { useMemo, useState, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { BoothListItem } from "./overview-types"

const pageSize = 5

type SortDirection = "asc" | "desc"

interface BoothListCardProps {
  readonly booths: ReadonlyArray<BoothListItem>
}

export function BoothListCard({ booths }: BoothListCardProps): ReactElement {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const filteredBooths = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID")
    const matches = normalizedQuery
      ? booths.filter((booth) =>
          booth.name.toLocaleLowerCase("id-ID").includes(normalizedQuery)
        )
      : [...booths]

    return matches.sort((first, second) =>
      sortDirection === "desc"
        ? second.transactionsToday - first.transactionsToday
        : first.transactionsToday - second.transactionsToday
    )
  }, [booths, query, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredBooths.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const visibleBooths = filteredBooths.slice(startIndex, startIndex + pageSize)
  const rangeStart = filteredBooths.length === 0 ? 0 : startIndex + 1
  const rangeEnd = Math.min(startIndex + pageSize, filteredBooths.length)
  const SortIcon = sortDirection === "desc" ? ArrowDown : ArrowUp

  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <CardTitle><h2>Daftar Booth</h2></CardTitle>
        <CardDescription>Detail transaksi untuk setiap booth</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-96 flex-col gap-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Cari nama booth"
            className="h-11 bg-muted pl-9"
            aria-label="Cari nama booth"
          />
        </div>

        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Booth</TableHead>
              <TableHead
                className="text-right"
                aria-sort={sortDirection === "desc" ? "descending" : "ascending"}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSortDirection((direction) =>
                      direction === "desc" ? "asc" : "desc"
                    )
                    setPage(1)
                  }}
                  className="inline-flex items-center gap-1 rounded-sm font-medium transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  aria-label={`Urutkan transaksi hari ini ${
                    sortDirection === "desc" ? "menaik" : "menurun"
                  }`}
                >
                  Transaksi Hari Ini
                  <SortIcon
                    className="size-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleBooths.length > 0 ? (
              visibleBooths.map((booth) => (
                <TableRow key={booth.id}>
                  <TableCell className="font-medium">{booth.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {booth.transactionsToday}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={2} className="h-44 text-center">
                  <p className="text-base font-semibold text-foreground">
                    Tidak ada data yang tersedia
                  </p>
                  {query && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Coba gunakan kata pencarian lain.
                    </p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-auto flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular-nums">
            {rangeStart} – {rangeEnd} dari {filteredBooths.length} data
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft aria-hidden="true" />
              Sebelumnya
            </Button>
            <Button
              variant="ghost"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Berikutnya
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
