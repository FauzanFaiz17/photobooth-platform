import type { ReactElement } from "react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { TrendBadge } from "../trend-badge"
import type { OverviewStat } from "./overview-types"

interface OverviewStatCardsProps {
  readonly stats: ReadonlyArray<OverviewStat>
  readonly periodLabel: string
}

export function OverviewStatCards({
  stats,
  periodLabel,
}: OverviewStatCardsProps): ReactElement {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label={`Statistik overview untuk periode ${periodLabel}`}
    >
      {stats.map((stat) => (
        <Card key={stat.id} className="shadow-none">
          <CardHeader>
            <CardDescription>
              <h2 className="text-sm font-normal">{stat.label}</h2>
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {stat.value}
            </CardTitle>
            {stat.trendDirection !== undefined &&
              stat.trendPercentage !== undefined && (
                <CardAction>
                  <TrendBadge
                    direction={stat.trendDirection}
                    percentage={stat.trendPercentage}
                  />
                </CardAction>
              )}
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5 text-sm">
            <p className="font-medium text-foreground">{stat.description}</p>
            <p className="text-muted-foreground">{periodLabel}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
