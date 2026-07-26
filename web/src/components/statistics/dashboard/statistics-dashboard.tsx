import { useMemo, useState, type ReactElement } from "react"

import {
  boothStatisticsRows,
  getBoothChartData,
  getBoothPeriodLabel,
  getBoothSummary,
  getRevenueTotal,
  metadataLeaderboard,
  popularFrames,
} from "../booth-dashboard/statistics-booth.data"
import { StatisticsBoothHeader } from "../booth-dashboard/statistics-booth-header"
import { StatisticsBoothList } from "../booth-dashboard/statistics-booth-list"
import type { BoothStatisticsPeriod } from "../booth-dashboard/statistics-booth.types"
import { StatisticsMetadataLeaderboard } from "../booth-dashboard/statistics-metadata-leaderboard"
import { StatisticsPeriodDetail } from "../booth-dashboard/statistics-period-detail"
import { StatisticsPeriodFilter } from "../booth-dashboard/statistics-period-filter"
import { StatisticsPopularFrames } from "../booth-dashboard/statistics-popular-frames"
import { StatisticsRevenueCard } from "../booth-dashboard/statistics-revenue-card"
import { StatisticsSummaryCards } from "../booth-dashboard/statistics-summary-cards"
import { StatisticsTopBooths } from "../booth-dashboard/statistics-top-booths"
import { kioskPerformanceData } from "../data/statistics-data"

export function StatisticsDashboard(): ReactElement {
  const [selectedDate, setSelectedDate] = useState("2026-07-17")
  const [period, setPeriod] = useState<BoothStatisticsPeriod>("month")

  const chartData = useMemo(() => getBoothChartData(period), [period])
  const periodLabel = useMemo(
    () => getBoothPeriodLabel(selectedDate, period),
    [period, selectedDate]
  )
  const summary = useMemo(
    () => getBoothSummary(selectedDate, period),
    [period, selectedDate]
  )
  const revenueTotal = useMemo(() => getRevenueTotal(period), [period])
  const weeklyData = useMemo(() => getBoothChartData("week"), [])
  const monthlyData = useMemo(() => getBoothChartData("month"), [])
  const activeBooths = kioskPerformanceData.filter((kiosk) => kiosk.status === "online").length

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <StatisticsBoothHeader
        date={selectedDate}
        activeBooths={activeBooths}
        totalBooths={kioskPerformanceData.length}
        onDateChange={setSelectedDate}
      />

      <StatisticsPeriodFilter value={period} onChange={setPeriod} />

      <StatisticsRevenueCard
        data={chartData}
        periodLabel={periodLabel}
        totalRevenue={revenueTotal}
      />

      <StatisticsSummaryCards metrics={summary} periodLabel={periodLabel} />

      <StatisticsPeriodDetail weeklyData={weeklyData} monthlyData={monthlyData} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]" aria-label="Statistik booth">
        <StatisticsBoothList booths={boothStatisticsRows} />
        <StatisticsTopBooths booths={boothStatisticsRows} />
      </section>

      <StatisticsPopularFrames frames={popularFrames} />

      <StatisticsMetadataLeaderboard rows={metadataLeaderboard} />
    </div>
  )
}
