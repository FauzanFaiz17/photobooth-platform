import { ArrowDownUp, ChevronLeft, ChevronRight, Search } from "lucide-react"
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
import type { BoothStatisticsRow } from "./statistics-booth.types"

const pageSize = 3

export function StatisticsBoothList({
  booths,
}: {
  readonly booths: ReadonlyArray<BoothStatisticsRow>
}): ReactElement {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const filteredBooths = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID")
    if (!normalizedQuery) return booths
    return booths.filter((booth) =>
      booth.name.toLocaleLowerCase("id-ID").includes(normalizedQuery)
    )
  }, [booths, query])

  const totalPages = Math.max(1, Math.ceil(filteredBooths.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const visibleBooths = filteredBooths.slice(startIndex, startIndex + pageSize)
  const rangeStart = filteredBooths.length === 0 ? 0 : startIndex + 1
  const rangeEnd = Math.min(startIndex + pageSize, filteredBooths.length)

  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <CardTitle><h2>Daftar Booth</h2></CardTitle>
        <CardDescription>Detail transaksi untuk setiap booth</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-[28rem] flex-col gap-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-60"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            className="h-11 pl-9"
            placeholder="Cari nama booth"
            aria-label="Cari nama booth"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booth</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  Transaksi Hari Ini
                  <ArrowDownUp className="size-3 opacity-50" aria-hidden="true" />
                </span>
              </TableHead>
              <TableHead className="text-right">Sesi Hari Ini</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleBooths.length > 0 ? (
              visibleBooths.map((booth) => (
                <TableRow key={booth.id}>
                  <TableCell className="font-medium">{booth.name}</TableCell>
                  <TableCell className="tabular-nums">{booth.transactionsToday}</TableCell>
                  <TableCell className="text-right tabular-nums">{booth.sessionsToday}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-52 text-center">
                  <p className="font-semibold">Tidak ada data yang tersedia</p>
                  <p className="mt-1 text-sm opacity-70">Coba gunakan kata pencarian lain.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-auto flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular-nums opacity-70">
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
