import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useMemo, useState, type ReactElement } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { kioskCatalog } from "./kiosk-catalog-data"
import { formatKioskCurrency, formatKioskDate } from "./kiosk-catalog-utils"

const pageSize = 5

export function KioskListPage(): ReactElement {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const filteredKiosks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID")
    if (!normalizedQuery) return kioskCatalog
    return kioskCatalog.filter((kiosk) =>
      kiosk.name.toLocaleLowerCase("id-ID").includes(normalizedQuery)
    )
  }, [query])

  const totalPages = Math.max(1, Math.ceil(filteredKiosks.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const visibleKiosks = filteredKiosks.slice(startIndex, startIndex + pageSize)
  const rangeStart = filteredKiosks.length === 0 ? 0 : startIndex + 1
  const rangeEnd = Math.min(startIndex + pageSize, filteredKiosks.length)

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8">
      <Card className="min-w-0 shadow-sm">
        <CardHeader className="gap-4 sm:grid-cols-[1fr_minmax(16rem,22rem)] sm:items-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            <h1>Daftar Kiosk</h1>
          </CardTitle>
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
              placeholder="Nama Kiosk"
              aria-label="Cari nama kiosk"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Nama Kiosk</TableHead>
                <TableHead>Jumlah Frame</TableHead>
                <TableHead>Lisensi</TableHead>
                <TableHead>Harga Per Cetak</TableHead>
                <TableHead>Tanggal Kedaluwarsa</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleKiosks.length > 0 ? (
                visibleKiosks.map((kiosk) => (
                  <TableRow key={kiosk.id}>
                    <TableCell className="pl-6 font-medium">{kiosk.name}</TableCell>
                    <TableCell>{kiosk.frameCount} Frame</TableCell>
                    <TableCell className="font-mono">{kiosk.license}</TableCell>
                    <TableCell>{formatKioskCurrency(kiosk.pricePerPrint)}</TableCell>
                    <TableCell>{formatKioskDate(kiosk.expiresAt)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link to={`/kiosk/${kiosk.slug}`} />}
                      >
                        Lihat Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <p className="font-semibold">Kiosk tidak ditemukan</p>
                    <p className="mt-1 text-sm opacity-70">
                      Coba gunakan nama kiosk yang berbeda.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 px-6 pb-2 sm:flex-row sm:items-center sm:justify-end">
            <p className="mr-2 text-sm tabular-nums opacity-70">
              {rangeStart} – {rangeEnd} dari {filteredKiosks.length} data
            </p>
            <Button
              variant="ghost"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft aria-hidden="true" />
              Sebelumnya
            </Button>
            <Button size="icon" aria-label={`Halaman ${currentPage}`}>
              {currentPage}
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
        </CardContent>
      </Card>
    </div>
  )
}
