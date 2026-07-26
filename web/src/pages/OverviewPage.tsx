import { useMemo, useState } from "react"

import { BoothListCard } from "@/components/overview/dashboard/booth-list-card"
import { KioskHealthCard } from "@/components/overview/dashboard/kiosk-health-card"
import {
  boothList,
  buildRevenueData,
  getOverviewStats,
  getPeriodLabel,
  getRevenueSummary,
  kioskHealth,
} from "@/components/overview/dashboard/overview-data"
import { OverviewHeader } from "@/components/overview/dashboard/overview-header"
import { OverviewPeriodFilter } from "@/components/overview/dashboard/overview-period-filter"
import { OverviewStatCards } from "@/components/overview/dashboard/overview-stat-cards"
import type { OverviewRange } from "@/components/overview/dashboard/overview-types"
import { RevenueCard } from "@/components/overview/dashboard/revenue-card"
import { TopBoothCard } from "@/components/overview/dashboard/top-booth-card"

export default function OverviewPage() {
  const [selectedDate, setSelectedDate] = useState("2026-07-17")
  const [selectedRange, setSelectedRange] = useState<OverviewRange>("day")

  const periodLabel = useMemo(
    () => getPeriodLabel(selectedDate, selectedRange),
    [selectedDate, selectedRange]
  )
  const revenueData = useMemo(
    () => buildRevenueData(selectedDate, selectedRange),
    [selectedDate, selectedRange]
  )
  const revenueSummary = useMemo(
    () => getRevenueSummary(selectedRange),
    [selectedRange]
  )
  const stats = useMemo(
    () => getOverviewStats(selectedDate, selectedRange),
    [selectedDate, selectedRange]
  )

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <OverviewHeader
        date={selectedDate}
        activeBooths={kioskHealth.filter((kiosk) => kiosk.status === "online").length}
        totalBooths={kioskHealth.length}
        onDateChange={setSelectedDate}
      />

      <OverviewStatCards stats={stats} periodLabel={periodLabel} />

      <RevenueCard
        data={revenueData}
        periodLabel={periodLabel}
        summary={revenueSummary}
        action={
          <OverviewPeriodFilter
            value={selectedRange}
            onChange={setSelectedRange}
          />
        }
      />

      <KioskHealthCard kiosks={kioskHealth} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-2" aria-label="Data booth">
        <BoothListCard booths={boothList} />
        <TopBoothCard booths={boothList} />
      </section>
    </div>
  )
}
