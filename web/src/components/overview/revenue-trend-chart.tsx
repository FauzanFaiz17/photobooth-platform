import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { OverviewSeriesPoint } from "@/features/reports/report-overview"

import { formatCompactNumber, formatRevenue } from "./overview-formatters"

const config = {
  revenue: { label: "Pendapatan", color: "var(--chart-1)" },
} satisfies ChartConfig

export function RevenueTrendChart({
  data,
}: {
  readonly data: ReadonlyArray<OverviewSeriesPoint>
}) {
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={[...data]} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={formatCompactNumber}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatRevenue(Number(value))}
            />
          }
        />
        <Area
          dataKey="revenue"
          type="monotone"
          stroke="var(--color-revenue)"
          fill="var(--color-revenue)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
