import {
  Camera,
  Circle,
  Info,
  Layers3,
  Printer,
  Wifi,
  WifiOff,
} from "lucide-react"
import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { KioskHealth } from "./overview-types"

interface KioskHealthCardProps {
  readonly kiosks: ReadonlyArray<KioskHealth>
}

export function KioskHealthCard({ kiosks }: KioskHealthCardProps): ReactElement {
  const offlineCount = kiosks.filter((kiosk) => kiosk.status === "offline").length

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <h2>Kesehatan Kiosk</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                aria-label="Informasi kesehatan kiosk"
                className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Info className="size-4" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>
                Status perangkat diperbarui otomatis dari heartbeat setiap kiosk.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Heartbeat live · refresh tiap 60 detik ·{" "}
          {offlineCount > 0 ? (
            <span className="font-medium text-destructive">
              {offlineCount} offline dari {kiosks.length}
            </span>
          ) : (
            <span className="font-medium text-foreground">
              semua kiosk online
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {kiosks.map((kiosk) => (
          <div
            key={kiosk.id}
            className="flex flex-col gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Circle
                className={kiosk.status === "online"
                  ? "size-3 fill-primary text-primary"
                  : "size-3 fill-destructive text-destructive"}
                aria-hidden="true"
              />
              {kiosk.name}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={kiosk.status === "online" ? "default" : "destructive"}>
                {kiosk.status === "online"
                  ? <Wifi aria-hidden="true" />
                  : <WifiOff aria-hidden="true" />}
                {kiosk.status === "online" ? "Online" : "Offline"}
              </Badge>
              <Badge variant={kiosk.printerConnected ? "secondary" : "destructive"}>
                <Printer aria-hidden="true" />
                {kiosk.printerConnected ? "Terhubung" : "Offline"}
              </Badge>
              <Badge variant={kiosk.cameraConnected ? "secondary" : "destructive"}>
                <Camera aria-hidden="true" />
                {kiosk.cameraConnected ? "Terhubung" : "Tidak terhubung"}
              </Badge>
              <Badge variant={kiosk.printQueue > 0 ? "default" : "outline"}>
                <Layers3 aria-hidden="true" />
                {kiosk.printQueue} antrian
              </Badge>
              <span aria-hidden="true">·</span>
              <span>{kiosk.lastSeen}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
