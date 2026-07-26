import { CalendarDays, TrendingUp } from "lucide-react"
import { useState, type ReactElement } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardAction,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BoothChartPoint, BoothDetailMetric } from "./statistics-booth.types"

const detailChartConfig = {
  revenue: { label: "Pendapatan", color: "var(--chart-1)" },
  photos: { label: "Foto", color: "var(--chart-2)" },
  vouchers: { label: "Sesi Voucher", color: "var(--chart-3)" },
} satisfies ChartConfig

const metricLabels: Record<BoothDetailMetric, string> = {
  revenue: "Pendapatan",
  photos: "Foto",
  vouchers: "Sesi Voucher",
}

const dayLabels = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const

function isDetailMetric(value: string): value is BoothDetailMetric {
  return value === "revenue" || value === "photos" || value === "vouchers"
}

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`
}

function formatMetricValue(value: number, metric: BoothDetailMetric): string {
  return metric === "revenue" ? formatRupiah(value) : value.toLocaleString("id-ID")
}

export function StatisticsPeriodDetail({
  weeklyData,
  monthlyData,
}: {
  readonly weeklyData: ReadonlyArray<BoothChartPoint>
  readonly monthlyData: ReadonlyArray<BoothChartPoint>
}): ReactElement {
  const [metric, setMetric] = useState<BoothDetailMetric>("revenue")
  const chartData = weeklyData.map((point, index) => ({
    ...point,
    day: dayLabels[index] ?? point.label,
  }))
  const weeklyRevenue = weeklyData.reduce((sum, point) => sum + point.revenue, 0)
  const monthlyRevenue = monthlyData.reduce((sum, point) => sum + point.revenue, 0)
  const chartTotal = weeklyData.reduce((sum, point) => sum + point[metric], 0)

  return (
    <section className="space-y-4" aria-labelledby="period-detail-title">
      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="period-detail-title" className="text-xs font-medium uppercase tracking-wide opacity-60">
          Detail Mingguan / Bulanan
        </h2>
        <Tabs
          value={metric}
          onValueChange={(value) => {
            if (isDetailMetric(value)) setMetric(value)
          }}
        >
          <TabsList className="w-full rounded-full border p-1 sm:w-auto">
            {(Object.keys(metricLabels) as BoothDetailMetric[]).map((item) => (
              <TabsTrigger key={item} value={item} className="rounded-full px-4">
                {metricLabels[item]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 opacity-60" aria-hidden="true" />
            <h3>Total Transaksi Harian (Senin – Minggu)</h3>
          </CardTitle>
          <CardDescription>Perbandingan {metricLabels[metric].toLocaleLowerCase("id-ID")} harian.</CardDescription>
          <CardAction className="text-right">
            <p className="text-xs opacity-60">Total Mingguan</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatMetricValue(chartTotal, metric)}
            </p>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={detailChartConfig}
            className="h-72 w-full min-w-0 aspect-auto"
            role="img"
            aria-label={`Grafik ${metricLabels[metric]} harian`}
          >
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={metric === "revenue" ? 72 : 44}
                tickFormatter={(value) => metric === "revenue" ? `${Math.round(Number(value) / 1_000)} rb` : String(value)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <div className="flex min-w-36 items-center justify-between gap-4">
                        <span className="opacity-70">{metricLabels[metric]}</span>
                        <span className="font-medium tabular-nums">
                          {formatMetricValue(Number(value), metric)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey={metric}
                fill={`var(--color-${metric})`}
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle><h3>Total Transaksi Mingguan</h3></CardTitle>
            <CardAction><TrendingUp className="size-5 opacity-60" aria-hidden="true" /></CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{formatRupiah(weeklyRevenue)}</p>
            <p className="mt-2 text-sm opacity-70">11 Jul – 17 Jul</p>
            <p className="mt-4 text-sm">Naik 6,8% dari minggu lalu</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle><h3>Total Transaksi Bulanan</h3></CardTitle>
            <CardAction><CalendarDays className="size-5 opacity-60" aria-hidden="true" /></CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{formatRupiah(monthlyRevenue)}</p>
            <p className="mt-2 text-sm opacity-70">Juli 2026</p>
            <p className="mt-4 text-sm">Naik 12,5% dari Juni 2026</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
