import {
  ArrowLeft,
  CircleAlert,
  RefreshCw,
  UserRoundX,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function UserDetailLoadingState() {
  return (
    <div
      className="space-y-6"
      aria-label="Memuat detail user"
      aria-busy="true"
    >
      <Skeleton className="h-8 w-40" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  )
}

export function UserDetailNotFoundState({
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
          <UserRoundX
            className="mx-auto size-10 text-muted-foreground"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            User tidak ditemukan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {invalidId
              ? "ID user pada alamat halaman tidak valid."
              : "Data user tidak tersedia atau sudah tidak dapat diakses."}
          </p>
          <Button
            variant="outline"
            className="mt-6"
            render={<Link to={returnTo} />}
          >
            <ArrowLeft aria-hidden="true" />
            Kembali ke Users
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function UserDetailErrorState({
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
            Detail user gagal dimuat
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
