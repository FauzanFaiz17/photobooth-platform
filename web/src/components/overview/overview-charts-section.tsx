import { CircleAlert, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import {
  useOverviewCharts,
  type OverviewPeriod,
} from "./hooks/use-overview-charts"
import { PartnerRankingChart } from "./partner-ranking-chart"
import { RevenueTrendChart } from "./revenue-trend-chart"
import { UsageChart } from "./usage-chart"

const PERIODS: ReadonlyArray<{ value: OverviewPeriod; label: string }> = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
]

function isOverviewPeriod(value: unknown): value is OverviewPeriod {
  return value === "daily" || value === "weekly" || value === "monthly"
}

export function OverviewChartsSection() {
  const {
    period,
    setPeriod,
    superAdmin,
    series,
    ranking,
    loadState,
    errorMessage,
    retry,
  } = useOverviewCharts()

  const hasData = series.some(
    (point) =>
      point.revenue > 0 ||
      point.sessions > 0 ||
      point.prints > 0 ||
      point.downloads > 0
  )

  return (
    <Card className="min-w-0">
      <CardHeader className="gap-4 border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Statistik penggunaan &amp; keuangan</CardTitle>
            <CardDescription>
              Diringkas dari laporan server. Filter periode harian, mingguan,
              bulanan.
            </CardDescription>
          </div>
          <Tabs
            value={period}
            onValueChange={(value) => {
              if (isOverviewPeriod(value)) setPeriod(value)
            }}
          >
            <TabsList>
              {PERIODS.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {loadState === "loading" && (
          <div className="grid gap-4" aria-busy>
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        )}

        {loadState === "error" && (
          <div className="grid min-h-48 place-items-center text-center">
            <div>
              <CircleAlert
                className="mx-auto size-9 text-destructive"
                aria-hidden="true"
              />
              <p className="mt-3 font-medium">Statistik gagal dimuat</p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
              <Button className="mt-4" variant="outline" onClick={retry}>
                <RefreshCw aria-hidden="true" /> Coba lagi
              </Button>
            </div>
          </div>
        )}

        {loadState === "success" && !hasData && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Belum ada data statistik untuk periode ini.
          </p>
        )}

        {loadState === "success" && hasData && (
          <>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Tren pendapatan</h3>
              <RevenueTrendChart data={series} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Penggunaan</h3>
              <UsageChart data={series} />
            </div>
            {superAdmin && ranking.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  Ranking partner (pendapatan)
                </h3>
                <PartnerRankingChart data={ranking} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
