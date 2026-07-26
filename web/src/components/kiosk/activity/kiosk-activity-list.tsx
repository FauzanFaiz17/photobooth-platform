import { Inbox } from "lucide-react"
import type { ReactElement } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import type { KioskActivity } from "../types/kiosk.types"
import { formatDateTime } from "../utils/kiosk-formatters"
import { kioskActivityMeta } from "../utils/kiosk-status-mapper"

interface KioskActivityListProps {
  readonly activities: ReadonlyArray<KioskActivity>
}

function KioskActivityEmptyState(): ReactElement {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <Inbox className="size-9 text-muted-foreground" aria-hidden="true" />
      <h3 className="mt-4 font-medium text-foreground">Belum ada aktivitas kiosk</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Event perangkat, pembayaran, sinkronisasi, dan storage akan muncul di sini.
      </p>
    </div>
  )
}

export function KioskActivityList({
  activities,
}: KioskActivityListProps): ReactElement {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <h2>Kiosk operational activity</h2>
        </CardTitle>
        <CardDescription>
          Recent device and service events for Main Studio Booth.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <KioskActivityEmptyState />
        ) : (
          <ol>
            {activities.map((activity, index) => {
              const activityMeta = kioskActivityMeta[activity.type]
              const ActivityIcon = activityMeta.icon

              return (
                <li key={activity.id} className="mt-2">
                  <div className="flex gap-3 py-4 pt-2 first:pt-0 last:pb-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <ActivityIcon className="size-4 text-foreground" aria-hidden="true" />
                      <span className="sr-only">{activityMeta.label}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{activity.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <time
                        dateTime={activity.occurredAt}
                        className="mt-1.5 block text-xs text-muted-foreground"
                      >
                        {formatDateTime(activity.occurredAt)}
                      </time>
                    </div>
                  </div>
                  {index < activities.length - 1 && <Separator />}
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
