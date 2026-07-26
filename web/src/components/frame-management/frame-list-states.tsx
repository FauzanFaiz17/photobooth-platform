import { Frame, SearchX } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function FrameListLoadingState(): ReactElement {
  return (
    <Card aria-label="Memuat daftar frame">
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b py-3 last:border-b-0">
            <Skeleton className="h-14 w-12" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function FrameListEmptyState({
  filtered,
  onReset,
  onCreate,
}: {
  readonly filtered: boolean
  readonly onReset: () => void
  readonly onCreate: () => void
}): ReactElement {
  return (
    <Card>
      <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
        {filtered ? <SearchX className="size-8 opacity-60" aria-hidden="true" /> : <Frame className="size-8 opacity-60" aria-hidden="true" />}
        <h2 className="mt-4 text-lg font-semibold">
          {filtered ? "Frame tidak ditemukan" : "Belum ada frame"}
        </h2>
        <p className="mt-1 max-w-md text-sm opacity-70">
          {filtered
            ? "Coba ubah nama atau ukuran frame yang sedang difilter."
            : "Tambahkan frame pertama untuk mulai mengatur tampilan sesi photobooth."}
        </p>
        <Button className="mt-4" variant={filtered ? "outline" : "default"} onClick={filtered ? onReset : onCreate}>
          {filtered ? "Reset Filter" : "Tambah Frame"}
        </Button>
      </CardContent>
    </Card>
  )
}
