import type { ReactElement } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { rangeLabels } from "./overview-data"
import type { OverviewRange } from "./overview-types"

interface OverviewPeriodFilterProps {
  readonly value: OverviewRange
  readonly onChange: (value: OverviewRange) => void
}

function isOverviewRange(value: string): value is OverviewRange {
  return value === "day" || value === "week" || value === "month"
}

export function OverviewPeriodFilter({
  value,
  onChange,
}: OverviewPeriodFilterProps): ReactElement {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => {
        if (isOverviewRange(nextValue)) onChange(nextValue)
      }}
    >
      <TabsList
        className="w-full rounded-full border border-border bg-transparent p-1 sm:w-auto"
        aria-label="Pilih rentang periode"
      >
        {(Object.keys(rangeLabels) as OverviewRange[]).map((range) => (
          <TabsTrigger
            key={range}
            value={range}
            className="rounded-full px-5 data-active:bg-primary data-active:text-primary-foreground"
          >
            {rangeLabels[range]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
