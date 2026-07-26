import { Download } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import type { StatisticsDateRange, StatisticsPeriod } from "../types/statistics.types"
import { StatisticsFilters } from "./statistics-filters"

interface StatisticsHeaderProps {
  readonly period: StatisticsPeriod
  readonly customRange: StatisticsDateRange
  readonly periodLabel: string
  readonly onPeriodChange: (period: StatisticsPeriod) => void
  readonly onCustomRangeChange: (range: StatisticsDateRange) => void
  readonly onExport: () => void
}

export function StatisticsHeader({
  period,
  customRange,
  periodLabel,
  onPeriodChange,
  onCustomRangeChange,
  onExport,
}: StatisticsHeaderProps): ReactElement {
  return (
    <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">Performance analytics</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Statistics</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Track sessions, revenue, kiosk performance, and customer activity.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Active period: {periodLabel}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
        <StatisticsFilters
          period={period}
          customRange={customRange}
          onPeriodChange={onPeriodChange}
          onCustomRangeChange={onCustomRangeChange}
        />
        <Button variant="outline" onClick={onExport}>
          <Download aria-hidden="true" /> Export Report
        </Button>
      </div>
    </header>
  )
}

