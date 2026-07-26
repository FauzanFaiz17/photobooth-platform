import {
  ChevronLeft,
  ChevronRight,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { useEffect, useMemo, useState, type ReactElement } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Toaster } from "@/components/ui/sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { FrameBulkDialog } from "./frame-bulk-dialog"
import { FrameDeleteDialog } from "./frame-delete-dialog"
import { FramePreview } from "./frame-preview"
import { frameKioskOptions, frameSizeMeta, initialManagedFrames } from "./frame-management.data"
import { FrameListEmptyState, FrameListLoadingState } from "./frame-list-states"
import type { ManagedFrame, ManagedFrameKind, ManagedFrameSize } from "./frame-management.types"

const pageSize = 6

function isFrameKind(value: string): value is ManagedFrameKind {
  return value === "photo" || value === "gif"
}

function isFrameSize(value: string): value is ManagedFrameSize {
  return value === "2R" || value === "4R" || value === "square"
}

export function FrameListPage(): ReactElement {
  const navigate = useNavigate()
  const [frames, setFrames] = useState<ReadonlyArray<ManagedFrame>>(initialManagedFrames)
  const [kind, setKind] = useState<ManagedFrameKind>("photo")
  const [query, setQuery] = useState("")
  const [size, setSize] = useState<ManagedFrameSize | "all">("all")
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [deleteFrame, setDeleteFrame] = useState<ManagedFrame | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 350)
    return () => window.clearTimeout(timer)
  }, [])

  const filteredFrames = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID")
    return frames.filter((frame) => {
      if (frame.kind !== kind) return false
      if (size !== "all" && frame.size !== size) return false
      return !normalizedQuery || frame.name.toLocaleLowerCase("id-ID").includes(normalizedQuery)
    })
  }, [frames, kind, query, size])

  const totalPages = Math.max(1, Math.ceil(filteredFrames.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const visibleFrames = filteredFrames.slice(startIndex, startIndex + pageSize)
  const filtered = query.trim().length > 0 || size !== "all"

  function changeKind(value: string): void {
    if (!isFrameKind(value)) return
    setKind(value)
    setPage(1)
    setQuery("")
    setSize("all")
  }

  function confirmDelete(): void {
    if (!deleteFrame) return
    setFrames((current) => current.filter((frame) => frame.id !== deleteFrame.id))
    toast.success(`${deleteFrame.name} berhasil dihapus dari dummy data.`)
    setDeleteFrame(null)
  }

  function submitBulk(frameIds: ReadonlyArray<string>, kioskId: string): void {
    const kioskName = frameKioskOptions.find((kiosk) => kiosk.id === kioskId)?.name ?? "kiosk"
    toast.success(`${frameIds.length} frame berhasil ditambahkan ke ${kioskName}.`)
    setBulkOpen(false)
  }

  const createPath = `/frame/new?type=${kind}`

  return (
    <div className="min-w-0 space-y-5 p-4 sm:p-6 lg:p-8">
      <Tabs value={kind} onValueChange={changeKind}>
        <TabsList>
          <TabsTrigger value="photo">Frame Photo</TabsTrigger>
          <TabsTrigger value="gif">Frame GIF</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daftar Frame</h1>
          <p className="mt-1 text-sm opacity-70">
            Kelola frame {kind === "photo" ? "foto" : "GIF animasi"} untuk seluruh kiosk photobooth.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(13rem,1fr)_13rem_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-60" aria-hidden="true" />
              <Input
                className="h-10 pl-9"
                value={query}
                placeholder="Nama Frame"
                aria-label="Cari berdasarkan nama frame"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select<string>
              value={size}
              onValueChange={(value) => {
                if (!value) return
                setSize(value === "all" || isFrameSize(value) ? value : "all")
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 w-full" aria-label="Filter ukuran frame"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Ukuran</SelectItem>
                {(Object.keys(frameSizeMeta) as ManagedFrameSize[]).map((frameSize) => (
                  <SelectItem key={frameSize} value={frameSize}>{frameSizeMeta[frameSize].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="h-10" variant="outline" onClick={() => setBulkOpen(true)}>
              <Layers3 aria-hidden="true" />
              Tambah Frame Massal ke Kiosk
            </Button>
            <Button className="h-10" render={<Link to={createPath} />}>
              <Plus aria-hidden="true" />
              Tambah Frame
            </Button>
          </div>

          {isLoading ? (
            <FrameListLoadingState />
          ) : visibleFrames.length === 0 ? (
            <FrameListEmptyState
              filtered={filtered}
              onReset={() => {
                setQuery("")
                setSize("all")
              }}
              onCreate={() => navigate(createPath)}
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Preview</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Ukuran</TableHead>
                      <TableHead>Jumlah Foto</TableHead>
                      <TableHead className="pr-4 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleFrames.map((frame) => (
                      <TableRow key={frame.id}>
                        <TableCell className="pl-4"><FramePreview frame={frame} compact animate={frame.kind === "gif"} /></TableCell>
                        <TableCell className="font-medium">{frame.name}</TableCell>
                        <TableCell>{frame.size}</TableCell>
                        <TableCell className="tabular-nums">{frame.slots.length} slot</TableCell>
                        <TableCell className="pr-4">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" aria-label={`Edit ${frame.name}`} render={<Link to={`/frame/${frame.id}/edit`} />}>
                              <Pencil aria-hidden="true" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label={`Hapus ${frame.name}`} onClick={() => setDeleteFrame(frame)}>
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm tabular-nums opacity-70">
                  {startIndex + 1}–{Math.min(startIndex + pageSize, filteredFrames.length)} dari {filteredFrames.length} frame
                </p>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="icon" aria-label="Halaman sebelumnya" disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    <ChevronLeft aria-hidden="true" />
                  </Button>
                  <Button size="icon" aria-label={`Halaman ${currentPage}`}>{currentPage}</Button>
                  <Button variant="outline" size="icon" aria-label="Halaman berikutnya" disabled={currentPage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {bulkOpen && (
        <FrameBulkDialog
          open
          frames={frames.filter((frame) => frame.kind === kind)}
          onOpenChange={setBulkOpen}
          onSubmit={submitBulk}
        />
      )}
      <FrameDeleteDialog
        frame={deleteFrame}
        onOpenChange={(open) => {
          if (!open) setDeleteFrame(null)
        }}
        onConfirm={confirmDelete}
      />
      <Toaster position="top-right" />
    </div>
  )
}
