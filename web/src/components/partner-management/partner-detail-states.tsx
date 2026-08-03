import { ArrowLeft, Building2, CircleAlert, RefreshCw } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PartnerDetailLoadingState() {
  return (
    <div
      className="space-y-6"
      aria-label="Memuat detail partner"
      aria-busy="true"
    >
      <Skeleton className="h-8 w-44" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  )
}

export function PartnerDetailNotFoundState({
  returnTo,
  invalidId = false,
}: {
  readonly returnTo: string
  readonly invalidId?: boolean
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="grid min-h-80 place-items-center py-12 text-center">
        <div className="max-w-md">
          <Building2
            className="mx-auto size-10 text-muted-foreground"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Partner tidak ditemukan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {invalidId
              ? "ID partner pada alamat halaman tidak valid."
              : "Data partner tidak tersedia atau sudah dihapus."}
          </p>
          <Button
            variant="outline"
            className="mt-6"
            render={<Link to={returnTo} />}
          >
            <ArrowLeft aria-hidden="true" />
            Kembali ke Partners
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function PartnerDetailErrorState({
  message,
  returnTo,
  onRetry,
}: {
  readonly message: string
  readonly returnTo: string
  readonly onRetry: () => void
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="grid min-h-80 place-items-center py-12 text-center">
        <div className="max-w-md">
          <CircleAlert
            className="mx-auto size-10 text-destructive"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Detail partner gagal dimuat
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="outline" render={<Link to={returnTo} />}>
              <ArrowLeft aria-hidden="true" />
              Kembali
            </Button>
            <Button onClick={onRetry}>
              <RefreshCw aria-hidden="true" />
              Coba lagi
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
