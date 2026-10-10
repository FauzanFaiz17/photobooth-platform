import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { OverviewChartRow } from "@/features/reports/report-overview"

import type { PartnerSeries } from "./hooks/use-overview-charts"

function buildConfig(series: ReadonlyArray<PartnerSeries>): ChartConfig {
  return series.reduce<ChartConfig>((config, item) => {
    config[item.key] = { label: item.label, color: item.color }
    return config
  }, {})
}

export function UsageChart({
  rows,
  series,
}: {
  readonly rows: ReadonlyArray<OverviewChartRow>
  readonly series: ReadonlyArray<PartnerSeries>
}) {
  return (
    <ChartContainer config={buildConfig(series)} className="h-64 w-full">
      <BarChart data={[...rows]} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((item) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            stackId="prints"
            fill={`var(--color-${item.key})`}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}
