import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

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
    toggleItems,
    togglePartner,
    setAllPartners,
    activeSeries,
    revenueRows,
    usageRows,
    ranking,
    loadState,
    errorMessage,
    retry,
  } = useOverviewCharts()

  const [twoColumns, setTwoColumns] = useState(false)
  const showToggles = superAdmin && toggleItems.length > 1

  return (
    <Card className="min-w-0">
      <CardHeader className="gap-4 border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Statistik penggunaan &amp; keuangan</CardTitle>
            <CardDescription>
              Langsung dari data pembayaran (live). Warna = partner; klik tombol
              untuk menyalakan/mematikan.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={twoColumns}
                onCheckedChange={setTwoColumns}
                aria-label="Tampilkan 2 kolom"
              />
              Tampilkan 2 kolom
            </label>
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
        </div>

        {showToggles && (
          <div className="flex flex-wrap items-center gap-2">
            {toggleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.enabled}
                onClick={() => togglePartner(item.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  item.enabled
                    ? "border-border bg-background text-foreground shadow-[0_2px_0_var(--border)]"
                    : "border-transparent bg-muted text-muted-foreground opacity-60"
                )}
              >
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                {item.label}
              </button>
            ))}
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => setAllPartners(true)}
            >
              Aktifkan semua
            </button>
          </div>
        )}
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

        {loadState === "success" && (
          <>
            <div className={cn("grid gap-6", twoColumns && "xl:grid-cols-2")}>
              <div className="min-w-0">
                <h3 className="mb-2 text-sm font-semibold">Tren pendapatan</h3>
                <RevenueTrendChart rows={revenueRows} series={activeSeries} />
              </div>
              <div className="min-w-0">
                <h3 className="mb-2 text-sm font-semibold">
                  Jumlah pembayaran per partner
                </h3>
                <UsageChart rows={usageRows} series={activeSeries} />
              </div>
            </div>

            {superAdmin && activeSeries.length > 1 && ranking.length > 0 && (
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
