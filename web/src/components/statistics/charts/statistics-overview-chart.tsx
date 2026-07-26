import type { ReactElement } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RevenueDataPoint, StatisticsChartMetric } from "../types/statistics.types"
import { formatCompactRupiah, formatInteger, formatRupiah, formatShortDate } from "../utils/statistics-formatters"
import { StatisticsEmptyState } from "../shared/statistics-empty-state"

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  sessions: { label: "Sessions", color: "var(--chart-2)" },
} satisfies ChartConfig

function isChartMetric(value: string): value is StatisticsChartMetric {
  return value === "revenue" || value === "sessions"
}

interface StatisticsOverviewChartProps {
  readonly data: ReadonlyArray<RevenueDataPoint>
  readonly metric: StatisticsChartMetric
  readonly periodLabel: string
  readonly onMetricChange: (metric: StatisticsChartMetric) => void
}

export function StatisticsOverviewChart({
  data,
  metric,
  periodLabel,
  onMetricChange,
}: StatisticsOverviewChartProps): ReactElement {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle><h2>Revenue Overview</h2></CardTitle>
          <CardDescription>Daily business performance for {periodLabel.toLocaleLowerCase("en-US")}.</CardDescription>
        </div>
        <Tabs value={metric} onValueChange={(value) => isChartMetric(value) && onMetricChange(value)}>
          <TabsList aria-label="Chart metric">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <StatisticsEmptyState title="No chart data" description="Select a range that contains recorded sessions." />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-80 w-full min-w-0 aspect-auto"
            role="img"
            aria-label={`${metric === "revenue" ? "Daily revenue in Rupiah" : "Daily photobooth sessions"} for ${periodLabel}`}
          >
            <LineChart data={[...data]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} tickFormatter={formatShortDate} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={metric === "revenue" ? 72 : 36}
                tickFormatter={metric === "revenue" ? formatCompactRupiah : formatInteger}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatShortDate(String(value))}
                    formatter={(value) => {
                      const numberValue = typeof value === "number" ? value : Number(value)
                      return (
                        <div className="flex min-w-40 items-center justify-between gap-4">
                          <span className="text-muted-foreground">{metric === "revenue" ? "Revenue" : "Sessions"}</span>
                          <span className="font-mono font-medium text-foreground tabular-nums">
                            {metric === "revenue" ? formatRupiah(numberValue) : formatInteger(numberValue)}
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Line
                dataKey={metric}
                type="monotone"
                stroke={`var(--color-${metric})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

