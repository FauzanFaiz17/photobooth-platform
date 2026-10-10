import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { OverviewSeriesPoint } from "@/features/reports/report-overview"

const config = {
  prints: { label: "Cetak", color: "var(--chart-2)" },
} satisfies ChartConfig

export function UsageChart({
  data,
}: {
  readonly data: ReadonlyArray<OverviewSeriesPoint>
}) {
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={[...data]} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="prints" fill="var(--color-prints)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
