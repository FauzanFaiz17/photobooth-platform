import { ArrowLeft, Download, SlidersHorizontal } from "lucide-react"
import { useMemo, useState, type ReactElement } from "react"
import { Link, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  defaultGalleryDetailFilters,
  findGalleryKiosk,
  getGalleryCaptures,
} from "../catalog/gallery-catalog-data"
import type {
  GalleryCaptureItem,
  GalleryDetailFilters,
} from "../catalog/gallery-catalog.types"
import { formatGalleryDate } from "../catalog/gallery-catalog-utils"
import { GalleryDetailFilter } from "./gallery-detail-filter"
import { GalleryDetailPagination } from "./gallery-detail-pagination"
import { GalleryPhotoCard } from "./gallery-photo-card"

const pageSize = 8

function exportGalleryData(items: ReadonlyArray<GalleryCaptureItem>, kioskName: string): void {
  const header = ["ID", "Tanggal", "Voucher", "Status"]
  const rows = items.map((item) => [
    item.id,
    item.capturedAt,
    item.voucherCode ?? "",
    item.approvalStatus,
  ])
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n")
  const file = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(file)
  const link = document.createElement("a")
  link.href = url
  link.download = `galeri-${kioskName.toLocaleLowerCase("id-ID").replaceAll(" ", "-")}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function filterCaptures(
  items: ReadonlyArray<GalleryCaptureItem>,
  filters: GalleryDetailFilters
): ReadonlyArray<GalleryCaptureItem> {
  return items.filter((item) => {
    const capturedDate = item.capturedAt.slice(0, 10)
    if (capturedDate < filters.dateFrom || capturedDate > filters.dateTo) return false
    if (filters.approvalStatus !== "all" && item.approvalStatus !== filters.approvalStatus) return false
    if (filters.voucherOnly && !item.voucherCode) return false
    return true
  })
}

export function GalleryDetailPage(): ReactElement {
  const { kioskId } = useParams<{ kioskId: string }>()
  const kiosk = findGalleryKiosk(kioskId)
  const [filters, setFilters] = useState<GalleryDetailFilters>(defaultGalleryDetailFilters)
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)

  const allPhotos = useMemo(
    () => kiosk ? getGalleryCaptures(kiosk.id) : [],
    [kiosk]
  )
  const filteredPhotos = useMemo(
    () => filterCaptures(allPhotos, filters),
    [allPhotos, filters]
  )
  const totalPages = Math.max(1, Math.ceil(filteredPhotos.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visiblePhotos = filteredPhotos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (!kiosk) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="mx-auto max-w-lg shadow-none">
          <CardHeader><CardTitle><h1>Galeri tidak ditemukan</h1></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm opacity-70">Data galeri kiosk yang Anda cari tidak tersedia.</p>
            <Button render={<Link to="/admin/gallery" />}>
              <ArrowLeft aria-hidden="true" />
              Kembali ke Daftar Galeri
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-5">
        <Button variant="ghost" render={<Link to="/admin/gallery" />}>
          <ArrowLeft aria-hidden="true" />
          Daftar Galeri
        </Button>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Galeri ({kiosk.name})</h1>
            <p className="mt-2 text-sm opacity-70">
              {formatGalleryDate(filters.dateFrom)} – {formatGalleryDate(filters.dateTo)} · {filteredPhotos.length} foto
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setFilterOpen((open) => !open)}
              aria-expanded={filterOpen}
            >
              <SlidersHorizontal aria-hidden="true" />
              Filter Galeri
            </Button>
            <Button onClick={() => exportGalleryData(filteredPhotos, kiosk.name)}>
              <Download aria-hidden="true" />
              Export Data Galeri
            </Button>
          </div>
        </div>
      </header>

      {filterOpen && (
        <GalleryDetailFilter
          filters={filters}
          onChange={(nextFilters) => {
            setFilters(nextFilters)
            setPage(1)
          }}
        />
      )}

      {visiblePhotos.length > 0 ? (
        <section
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
          aria-label={`Foto galeri ${kiosk.name}`}
        >
          {visiblePhotos.map((photo) => (
            <GalleryPhotoCard key={photo.id} photo={photo} />
          ))}
        </section>
      ) : (
        <Card className="shadow-none">
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <p className="font-semibold">Tidak ada foto pada filter ini</p>
            <p className="mt-1 text-sm opacity-70">Ubah rentang tanggal atau status persetujuan.</p>
          </CardContent>
        </Card>
      )}

      <GalleryDetailPagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={filteredPhotos.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  )
}
