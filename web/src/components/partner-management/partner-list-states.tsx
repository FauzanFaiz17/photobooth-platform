import { Building2, CircleAlert, Plus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const skeletonRows = Array.from({ length: 5 }, (_, index) => index)

export function PartnerListLoadingState() {
  return (
    <div aria-label="Memuat daftar partner" aria-busy="true">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Partner</TableHead>
            <TableHead>Kontak</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Langganan</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead className="pr-6 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skeletonRows.map((row) => (
            <TableRow key={row}>
              <TableCell className="pl-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="pr-6">
                <Skeleton className="ml-auto h-7 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function PartnerListErrorState({
  message,
  onRetry,
}: {
  readonly message: string
  readonly onRetry: () => void
}) {
  return (
    <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
      <div className="max-w-md">
        <CircleAlert
          className="mx-auto size-9 text-destructive"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Daftar partner gagal dimuat
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Coba lagi
        </Button>
      </div>
    </div>
  )
}

export function PartnerListEmptyState({
  filtered,
  onReset,
  onCreate,
}: {
  readonly filtered: boolean
  readonly onReset: () => void
  readonly onCreate: () => void
}) {
  return (
    <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
      <div className="max-w-md">
        <Building2
          className="mx-auto size-9 text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          {filtered ? "Partner tidak ditemukan" : "Belum ada partner"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered
            ? "Coba ubah kata pencarian atau filter status."
            : "Tambahkan partner pertama untuk mulai mengelola tenant."}
        </p>
        {filtered ? (
          <Button variant="outline" className="mt-5" onClick={onReset}>
            <RefreshCw aria-hidden="true" />
            Reset filter
          </Button>
        ) : (
          <Button className="mt-5" onClick={onCreate}>
            <Plus aria-hidden="true" />
            Tambah partner
          </Button>
        )}
      </div>
    </div>
  )
}
