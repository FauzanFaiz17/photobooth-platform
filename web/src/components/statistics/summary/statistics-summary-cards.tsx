import {
  Banknote,
  Camera,
  CircleDollarSign,
  Minus,
  ScanFace,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import type { ReactElement } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type {
  StatisticsSummaryMetric,
  StatisticsSummaryMetricId,
  StatisticsTrendDirection,
} from "../types/statistics.types"
import { formatInteger, formatPercentage, formatRupiah } from "../utils/statistics-formatters"

const metricIcons = {
  revenue: Banknote,
  sessions: ScanFace,
  photos: Camera,
  "average-value": CircleDollarSign,
} satisfies Record<StatisticsSummaryMetricId, LucideIcon>

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
} satisfies Record<StatisticsTrendDirection, LucideIcon>

const trendClasses = {
  up: "text-primary",
  down: "text-destructive",
  neutral: "text-muted-foreground",
} satisfies Record<StatisticsTrendDirection, string>

function formatMetricValue(metric: StatisticsSummaryMetric): string {
  return metric.valueKind === "currency" ? formatRupiah(metric.value) : formatInteger(metric.value)
}

export function StatisticsSummaryCards({ metrics }: { readonly metrics: ReadonlyArray<StatisticsSummaryMetric> }): ReactElement {
  return (
    <section aria-labelledby="statistics-summary-heading">
      <h2 id="statistics-summary-heading" className="sr-only">Statistics summary</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const MetricIcon = metricIcons[metric.id]
          const TrendIcon = trendIcons[metric.trend]
          return (
            <Card key={metric.id} className="shadow-none">
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                      {formatMetricValue(metric)}
                    </p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger render={<span className="flex size-9 items-center justify-center rounded-lg bg-muted" tabIndex={0} />}>
                      <MetricIcon className="size-4 text-foreground" aria-hidden="true" />
                      <span className="sr-only">About {metric.label}</span>
                    </TooltipTrigger>
                    <TooltipContent>{metric.tooltip}</TooltipContent>
                  </Tooltip>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className={cn("inline-flex items-center gap-1 font-medium", trendClasses[metric.trend])}>
                    <TrendIcon className="size-3.5" aria-hidden="true" />
                    {metric.changePercentage > 0 ? "+" : ""}{formatPercentage(metric.changePercentage)}
                  </span>
                  <span className="text-muted-foreground">{metric.comparisonLabel}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

