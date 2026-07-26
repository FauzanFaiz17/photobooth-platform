import { CircleAlert } from "lucide-react"
import type { ReactElement } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { KioskStatusBadge } from "../shared/kiosk-status-badge"
import type {
  DeviceHealthAction,
  KioskDeviceHealthItem,
} from "../types/kiosk.types"
import { formatRelativeTime } from "../utils/kiosk-formatters"
import {
  deviceHealthIcons,
  getDeviceHealthStatusMeta,
} from "../utils/kiosk-status-mapper"

interface KioskDeviceHealthProps {
  readonly items: ReadonlyArray<KioskDeviceHealthItem>
  readonly referenceTime: string
}

const actionFeedback = {
  "test-camera": "Camera test selesai. Capture dan preview berfungsi normal.",
  "test-printer": "Printer test dikirim. Printer merespons dan siap mencetak.",
  "check-payment": "Payment terminal aktif dan health check berhasil.",
  "retry-connection": "Internet connection stabil dengan latency 28 ms.",
} satisfies Record<DeviceHealthAction, string>

export function KioskDeviceHealth({
  items,
  referenceTime,
}: KioskDeviceHealthProps): ReactElement {
  const printer = items.find((item) => item.id === "printer")

  const handleHealthAction = (
    action: DeviceHealthAction,
    label: string
  ): void => {
    toast.success(label, { description: actionFeedback[action] })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <h2>Device health</h2>
        </CardTitle>
        <CardDescription>
          Current state of hardware, network, and local services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {printer?.status === "disconnected" && (
          <Alert variant="destructive" className="mb-4">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>Printer disconnected</AlertTitle>
            <AlertDescription>
              Printing is paused. Check the USB connection and printer power.
            </AlertDescription>
          </Alert>
        )}

        <ul>
          {items.map((item, index) => {
            const DeviceIcon = deviceHealthIcons[item.id]
            const statusMeta = getDeviceHealthStatusMeta(item.status)
            const itemAction = item.action

            return (
              <li key={item.id}>
                <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <DeviceIcon className="size-4 text-foreground" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{item.label}</p>
                        <KioskStatusBadge meta={{ ...statusMeta, label: item.statusLabel }} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <time
                        dateTime={item.lastCheckedAt}
                        className="mt-1 block text-xs text-muted-foreground"
                      >
                        Checked {formatRelativeTime(item.lastCheckedAt, referenceTime)}
                      </time>
                    </div>
                  </div>
                  {itemAction && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start sm:self-center"
                      onClick={() =>
                        handleHealthAction(itemAction.type, itemAction.label)
                      }
                    >
                      {itemAction.label}
                    </Button>
                  )}
                </div>
                {index < items.length - 1 && <Separator />}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
