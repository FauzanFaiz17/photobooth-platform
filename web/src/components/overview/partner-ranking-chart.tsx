import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { formatCompactNumber, formatRevenue } from "./overview-formatters"

export interface RankingDatum {
  readonly name: string
  readonly revenue: number
}

const config = {
  revenue: { label: "Pendapatan", color: "var(--chart-2)" },
} satisfies ChartConfig

export function PartnerRankingChart({
  data,
}: {
  readonly data: ReadonlyArray<RankingDatum>
}) {
  return (
    <ChartContainer config={config} className="h-72 w-full">
      <BarChart data={[...data]} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCompactNumber}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={116}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatRevenue(Number(value))}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
