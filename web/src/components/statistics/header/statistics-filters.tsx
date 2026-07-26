import { CalendarDays } from "lucide-react"
import type { ReactElement } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { statisticsPeriods } from "../data/statistics-data"
import type { StatisticsDateRange, StatisticsPeriod } from "../types/statistics.types"

interface StatisticsFiltersProps {
  readonly period: StatisticsPeriod
  readonly customRange: StatisticsDateRange
  readonly onPeriodChange: (period: StatisticsPeriod) => void
  readonly onCustomRangeChange: (range: StatisticsDateRange) => void
}

export function StatisticsFilters({
  period,
  customRange,
  onPeriodChange,
  onCustomRangeChange,
}: StatisticsFiltersProps): ReactElement {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Select<StatisticsPeriod>
        value={period}
        items={statisticsPeriods}
        onValueChange={(value) => value !== null && onPeriodChange(value)}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Select statistics period">
          <CalendarDays aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {statisticsPeriods.map((item) => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period === "custom" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div>
            <Label htmlFor="statistics-date-from" className="sr-only">Custom range start date</Label>
            <Input
              id="statistics-date-from"
              type="date"
              value={customRange.from}
              max={customRange.to}
              onChange={(event) => {
                if (event.target.value) onCustomRangeChange({ ...customRange, from: event.target.value })
              }}
            />
          </div>
          <div>
            <Label htmlFor="statistics-date-to" className="sr-only">Custom range end date</Label>
            <Input
              id="statistics-date-to"
              type="date"
              value={customRange.to}
              min={customRange.from}
              onChange={(event) => {
                if (event.target.value) onCustomRangeChange({ ...customRange, to: event.target.value })
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
