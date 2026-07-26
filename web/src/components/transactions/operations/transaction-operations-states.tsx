import { SearchX } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TransactionOperationsLoadingState(): ReactElement {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8" aria-label="Memuat transaksi">
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-36" />)}
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-96" />
    </div>
  )
}

export function TransactionOperationsEmptyState({
  onReset,
}: {
  readonly onReset: () => void
}): ReactElement {
  return (
    <Card className="shadow-none">
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <SearchX className="size-10 opacity-50" aria-hidden="true" />
        <p className="mt-4 font-semibold">Tidak ada transaksi yang ditemukan</p>
        <p className="mt-1 max-w-md text-sm opacity-70">
          Ubah pencarian, rentang tanggal, kiosk, status, mode sesi, atau metode pembayaran.
        </p>
        <Button variant="outline" className="mt-4" onClick={onReset}>Reset Filter</Button>
      </CardContent>
    </Card>
  )
}
