import type { ReactElement, ReactNode } from "react"
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

import { formatCompactRupiah, formatRupiah } from "../formatters"
import { TrendBadge } from "../trend-badge"
import type { OverviewChartPoint, RevenueSummary } from "./overview-types"

const chartConfig = {
  revenue: {
    label: "Pendapatan",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface RevenueCardProps {
  readonly data: ReadonlyArray<OverviewChartPoint>
  readonly periodLabel: string
  readonly summary: RevenueSummary
  readonly action?: ReactNode
}

export function RevenueCard({
  data,
  periodLabel,
  summary,
  action,
}: RevenueCardProps): ReactElement {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader className="gap-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle>
              <h2>Pendapatan</h2>
            </CardTitle>
            <CardDescription className="mt-1">
              Total untuk periode {periodLabel}
            </CardDescription>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground sm:text-4xl">
                {formatRupiah(summary.total)}
              </p>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendBadge
                  direction="up"
                  percentage={summary.trendPercentage}
                />
                dari periode sebelumnya
              </span>
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-72 w-full min-w-0 aspect-auto sm:h-80"
          role="img"
          aria-label={`Grafik pendapatan untuk periode ${periodLabel}`}
        >
          <LineChart
            data={[...data]}
            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={14}
            />
            <YAxis
              type="number"
              domain={[0, "auto"]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={64}
              tickFormatter={(value) => formatCompactRupiah(Number(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => String(value)}
                  formatter={(value) => (
                    <div className="flex min-w-36 items-center justify-between gap-4">
                      <span className="text-muted-foreground">Pendapatan</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {formatRupiah(Number(value))}
                      </span>
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
