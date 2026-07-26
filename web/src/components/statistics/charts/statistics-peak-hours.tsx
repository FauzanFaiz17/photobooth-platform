import type { ReactElement } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { PeakHourDataPoint } from "../types/statistics.types"
import { getPeakHourInsight } from "../utils/statistics-helpers"
import { formatInteger } from "../utils/statistics-formatters"
import { StatisticsEmptyState } from "../shared/statistics-empty-state"

const chartConfig = {
  sessions: { label: "Sessions", color: "var(--chart-1)" },
} satisfies ChartConfig

export function StatisticsPeakHours({ data }: { readonly data: ReadonlyArray<PeakHourDataPoint> }): ReactElement {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <CardTitle><h2>Peak Hours</h2></CardTitle>
        <CardDescription>Kiosk usage by hour across the selected period.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <StatisticsEmptyState title="No hourly activity" />
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="h-72 w-full min-w-0 aspect-auto"
              role="img"
              aria-label="Bar chart of photobooth sessions from 08:00 to 22:00"
            >
              <BarChart data={[...data]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={10} minTickGap={16} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} tickFormatter={formatInteger} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="sessions" fill="var(--color-sessions)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ChartContainer>
            <p className="mt-4 border-l-2 border-primary pl-3 text-sm text-muted-foreground">
              {getPeakHourInsight(data)}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

