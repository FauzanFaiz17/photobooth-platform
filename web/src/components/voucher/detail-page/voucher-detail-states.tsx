import { TicketX } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function VoucherDetailLoadingState(): ReactElement {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8" aria-label="Memuat voucher">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-36" />
      <Skeleton className="h-96" />
    </div>
  )
}

export function VoucherDetailEmptyState({
  onReset,
}: {
  readonly onReset: () => void
}): ReactElement {
  return (
    <Card className="shadow-none">
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <TicketX className="size-10 opacity-50" aria-hidden="true" />
        <p className="mt-4 font-semibold">Voucher tidak ditemukan</p>
        <p className="mt-1 max-w-md text-sm opacity-70">
          Ubah status, tipe, pencarian nama, kode, atau tanggal dibuat.
        </p>
        <Button variant="outline" className="mt-4" onClick={onReset}>Reset Filter</Button>
      </CardContent>
    </Card>
  )
}
