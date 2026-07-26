import { Banknote, CircleCheck, FileDown, LayoutTemplate, MonitorOff, type LucideIcon } from "lucide-react"
import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatisticsActivity, StatisticsActivityStatus, StatisticsActivityType } from "../types/statistics.types"
import { formatDateTime } from "../utils/statistics-formatters"
import { StatisticsEmptyState } from "../shared/statistics-empty-state"

const activityIcons = {
  session: CircleCheck,
  revenue: Banknote,
  kiosk: MonitorOff,
  template: LayoutTemplate,
  report: FileDown,
} satisfies Record<StatisticsActivityType, LucideIcon>

const activityStatusLabels = {
  success: "Success",
  warning: "Attention",
  information: "Info",
} satisfies Record<StatisticsActivityStatus, string>

const activityStatusVariants = {
  success: "default",
  warning: "destructive",
  information: "secondary",
} satisfies Record<StatisticsActivityStatus, "default" | "destructive" | "secondary">

export function StatisticsRecentActivity({
  activities,
}: {
  readonly activities: ReadonlyArray<StatisticsActivity>
}): ReactElement {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle><h2>Recent Activity</h2></CardTitle>
        <CardDescription>Latest events affecting the statistics workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <StatisticsEmptyState title="No recent activity" />
        ) : (
          <ol className="divide-y divide-border">
            {activities.map((activity) => {
              const ActivityIcon = activityIcons[activity.type]
              return (
                <li key={activity.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <ActivityIcon className="size-4 text-foreground" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{activity.title}</p>
                      {activity.status && <Badge variant={activityStatusVariants[activity.status]}>{activityStatusLabels[activity.status]}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                    <time className="mt-1 block text-xs text-muted-foreground" dateTime={activity.occurredAt}>{formatDateTime(activity.occurredAt)}</time>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
