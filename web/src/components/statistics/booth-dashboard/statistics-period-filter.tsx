import type { ReactElement } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { boothPeriodLabels } from "./statistics-booth.data"
import type { BoothStatisticsPeriod } from "./statistics-booth.types"

function isBoothPeriod(value: string): value is BoothStatisticsPeriod {
  return value === "day" || value === "week" || value === "month"
}

export function StatisticsPeriodFilter({
  value,
  onChange,
}: {
  readonly value: BoothStatisticsPeriod
  readonly onChange: (period: BoothStatisticsPeriod) => void
}): ReactElement {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium uppercase tracking-wide opacity-60">Overview</p>
      <Tabs
        value={value}
        onValueChange={(nextValue) => {
          if (isBoothPeriod(nextValue)) onChange(nextValue)
        }}
      >
        <TabsList className="w-full rounded-full border p-1 sm:w-auto">
          {(Object.keys(boothPeriodLabels) as BoothStatisticsPeriod[]).map((period) => (
            <TabsTrigger key={period} value={period} className="rounded-full px-5">
              {boothPeriodLabels[period]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
