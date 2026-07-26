import { CircleAlert, MonitorOff } from "lucide-react"
import type { ReactElement } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function KioskLoadingState(): ReactElement {
  return (
    <div className="space-y-6" aria-label="Loading kiosk">
      <Skeleton className="h-36 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  )
}

export function KioskNotFoundState(): ReactElement {
  return (
    <Card>
      <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
        <MonitorOff className="size-9 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Kiosk tidak ditemukan</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Data kiosk belum tersedia. Periksa assignment perangkat atau coba muat ulang halaman.
        </p>
      </CardContent>
    </Card>
  )
}

export function KioskOfflineAlert(): ReactElement {
  return (
    <Alert variant="destructive">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>Device offline</AlertTitle>
      <AlertDescription>
        Kiosk tidak menerima heartbeat. Periksa daya, jaringan, dan application service.
      </AlertDescription>
    </Alert>
  )
}
