import { Camera, Info, Monitor, Printer } from "lucide-react"
import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { KioskCatalogItem } from "../catalog/kiosk-catalog.types"
import {
  formatKioskDate,
  getDaysUntilExpiration,
} from "../catalog/kiosk-catalog-utils"

interface KioskStatusOverviewProps {
  readonly kiosk: KioskCatalogItem
}

export function KioskStatusOverview({ kiosk }: KioskStatusOverviewProps): ReactElement {
  return (
    <section className="grid gap-4 xl:grid-cols-2" aria-label="Status kiosk">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="size-4 opacity-70" aria-hidden="true" />
            <h2>{kiosk.name}</h2>
            <Info className="size-4 opacity-60" aria-hidden="true" />
          </CardTitle>
          <CardAction>
            <Badge variant={kiosk.status === "online" ? "default" : "destructive"}>
              {kiosk.status === "online" ? "Online" : "Offline"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase opacity-60">Tanggal Kedaluwarsa</p>
            <p className="mt-1 font-semibold">{formatKioskDate(kiosk.expiresAt)}</p>
            <p className="text-xs opacity-60">{getDaysUntilExpiration(kiosk.expiresAt)} hari lagi</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase opacity-60">Versi App</p>
            <p className="mt-1 font-medium">{kiosk.applicationVersion}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase opacity-60">Orientasi Layar</p>
            <p className="mt-1 font-medium">{kiosk.screenOrientation}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase opacity-60">Ping</p>
            <p className="mt-1 font-medium">{kiosk.status === "online" ? "28 ms" : "–"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase opacity-60">Upload</p>
            <p className="mt-1 font-medium">{kiosk.status === "online" ? "Stabil" : "–"}</p>
          </div>
          <p className="text-xs opacity-60 sm:col-span-2">
            Heartbeat terakhir {kiosk.lastHeartbeat}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="size-4 opacity-70" aria-hidden="true" />
              <h2>Printer</h2>
            </CardTitle>
            <CardAction>
              <Badge variant={kiosk.printer.status === "ready" ? "default" : "destructive"}>
                {kiosk.printer.status === "ready" ? "Siap" : "Offline"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium uppercase opacity-60">Nama Printer</p>
            <p className="mt-1 font-medium">{kiosk.printer.name}</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="size-4 opacity-70" aria-hidden="true" />
              <h2>Kamera</h2>
            </CardTitle>
            <CardAction>
              <Badge variant={kiosk.camera.connected ? "default" : "destructive"}>
                {kiosk.camera.connected ? "Terhubung" : "Tidak terhubung"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium uppercase opacity-60">Perangkat</p>
            <p className="mt-1 font-medium">{kiosk.camera.name}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
