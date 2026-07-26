import type { ReactElement } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { BoothChartPoint } from "./statistics-booth.types"

const revenueChartConfig = {
  revenue: { label: "Pendapatan", color: "var(--chart-1)" },
} satisfies ChartConfig

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`
}

function formatCompactRupiah(value: number): string {
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`
  }
  return `Rp ${Math.round(value / 1_000)} rb`
}

interface StatisticsRevenueCardProps {
  readonly data: ReadonlyArray<BoothChartPoint>
  readonly periodLabel: string
  readonly totalRevenue: number
}

export function StatisticsRevenueCard({
  data,
  periodLabel,
  totalRevenue,
}: StatisticsRevenueCardProps): ReactElement {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wide opacity-60">Pendapatan</p>
        <CardTitle className="text-4xl font-semibold tracking-tight">
          {formatRupiah(totalRevenue)}
        </CardTitle>
        <CardDescription>{periodLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={revenueChartConfig}
          className="h-72 w-full min-w-0 aspect-auto sm:h-80"
          role="img"
          aria-label={`Grafik pendapatan periode ${periodLabel}`}
        >
          <LineChart data={[...data]} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} minTickGap={18} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={72}
              tickFormatter={(value) => formatCompactRupiah(Number(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => String(value)}
                  formatter={(value) => (
                    <div className="flex min-w-36 items-center justify-between gap-4">
                      <span className="opacity-70">Pendapatan</span>
                      <span className="font-medium tabular-nums">{formatRupiah(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Line
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
