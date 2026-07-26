import { MapPin, Monitor, RefreshCw, Tag } from "lucide-react"
import type { ReactElement } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { KioskOfflineAlert } from "../shared/kiosk-page-states"
import { KioskStatusBadge } from "../shared/kiosk-status-badge"
import type { KioskIdentity } from "../types/kiosk.types"
import { formatRelativeTime } from "../utils/kiosk-formatters"
import {
  getKioskModeMeta,
  getKioskStatusMeta,
} from "../utils/kiosk-status-mapper"

interface KioskIdentitySummaryProps {
  readonly kiosk: KioskIdentity
  readonly referenceTime: string
}

interface IdentityDetailProps {
  readonly label: string
  readonly value: string
}

function IdentityDetail({ label, value }: IdentityDetailProps): ReactElement {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

export function KioskIdentitySummary({
  kiosk,
  referenceTime,
}: KioskIdentitySummaryProps): ReactElement {
  const statusMeta = getKioskStatusMeta(kiosk.status)
  const modeMeta = getKioskModeMeta(kiosk.mode)

  return (
    <section aria-labelledby="kiosk-identity-title" className="space-y-4">
      {kiosk.status === "offline" && <KioskOfflineAlert />}
      <Card className="shadow-sm">
        <CardContent>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Monitor className="size-6 text-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="kiosk-identity-title" className="text-xl font-semibold text-foreground">
                    {kiosk.name}
                  </h2>
                  <KioskStatusBadge meta={statusMeta} />
                  <KioskStatusBadge meta={modeMeta} />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {kiosk.location}
                </p>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden h-16 lg:block" />

            <dl className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <IdentityDetail label="Kiosk ID" value={kiosk.id} />
              <IdentityDetail label="Assigned device" value={kiosk.assignedDevice} />
              <IdentityDetail label="App version" value={kiosk.applicationVersion} />
              <IdentityDetail
                label="Last sync"
                value={formatRelativeTime(kiosk.lastSyncAt, referenceTime)}
              />
            </dl>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Tag className="size-3.5" aria-hidden="true" />
              Basic plan · 1 kiosk
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Automatic sync enabled
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
