import type { ReactElement } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { SessionDistributionItem } from "../types/statistics.types"
import { formatInteger, formatPercentage } from "../utils/statistics-formatters"
import { StatisticsEmptyState } from "../shared/statistics-empty-state"

const chartConfig = {
  percentage: { label: "Share", color: "var(--chart-2)" },
} satisfies ChartConfig

export function StatisticsSessionDistribution({
  items,
}: {
  readonly items: ReadonlyArray<SessionDistributionItem>
}): ReactElement {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <CardTitle><h2>Session Distribution</h2></CardTitle>
        <CardDescription>Session outcomes within the active reporting period.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <StatisticsEmptyState title="No session data" />
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="h-64 w-full min-w-0 aspect-auto"
              role="img"
              aria-label="Horizontal bar chart of completed, cancelled, failed, and in-progress sessions"
            >
              <BarChart data={[...items]} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }} accessibilityLayer>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={78} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, _name, item) => {
                        const count = typeof item.payload.count === "number" ? item.payload.count : 0
                        const percentage = typeof value === "number" ? value : Number(value)
                        return (
                          <div className="flex min-w-40 items-center justify-between gap-4">
                            <span className="text-muted-foreground">{String(item.payload.label)}</span>
                            <span className="font-mono font-medium text-foreground">{formatInteger(count)} · {formatPercentage(percentage, 0)}</span>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Bar dataKey="percentage" fill="var(--color-percentage)" radius={4} />
              </BarChart>
            </ChartContainer>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Session distribution legend">
              {items.map((item) => (
                <li key={item.status} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground tabular-nums">{formatInteger(item.count)} · {formatPercentage(item.percentage, 0)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}

