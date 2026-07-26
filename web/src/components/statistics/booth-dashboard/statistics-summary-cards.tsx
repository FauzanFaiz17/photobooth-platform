import type { ReactElement } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BoothSummaryMetric } from "./statistics-booth.types"

export function StatisticsSummaryCards({
  metrics,
  periodLabel,
}: {
  readonly metrics: ReadonlyArray<BoothSummaryMetric>
  readonly periodLabel: string
}): ReactElement {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan statistik">
      {metrics.map((metric) => (
        <Card key={metric.id} className="min-h-44 shadow-none">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wide opacity-60">
              <h2>{metric.label}</h2>
            </CardTitle>
            <p className="text-xs opacity-60">{periodLabel}</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-5">
            <div>
              <p className="text-2xl font-semibold tabular-nums">{metric.value}</p>
              <p className="mt-1 text-sm opacity-70">{metric.description}</p>
            </div>
            <div className="h-0.5 w-full border-t-2" aria-hidden="true" />
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
