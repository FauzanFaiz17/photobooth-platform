import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { KioskStatusBadge } from "../shared/kiosk-status-badge"
import type { KioskDeviceHealthItem } from "../types/kiosk.types"
import { deviceHealthIcons, getDeviceHealthStatusMeta } from "../utils/kiosk-status-mapper"

interface KioskHealthSummaryProps {
  readonly items: ReadonlyArray<KioskDeviceHealthItem>
}

export function KioskHealthSummary({ items }: KioskHealthSummaryProps): ReactElement {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <h2>Operational health</h2>
        </CardTitle>
        <CardDescription>Quick status across all kiosk services.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          {items.map((item) => {
            const ItemIcon = deviceHealthIcons[item.id]
            const statusMeta = getDeviceHealthStatusMeta(item.status)

            return (
              <li key={item.id} className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <ItemIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                </div>
                <KioskStatusBadge meta={{ ...statusMeta, label: item.statusLabel }} />
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
import type { ReactElement } from "react"
