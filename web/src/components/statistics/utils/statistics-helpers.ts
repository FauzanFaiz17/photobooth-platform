import { statisticsDataByPeriod } from "../data/statistics-data"
import type {
  KioskPaginationState,
  KioskPerformance,
  KioskSortOption,
  KioskStatusFilter,
  PeakHourDataPoint,
  RevenueDataPoint,
  SessionDistributionItem,
  StatisticsDateRange,
  StatisticsPeriod,
  StatisticsPeriodData,
  StatisticsSummary,
} from "../types/statistics.types"

function calculateDistribution(totalSessions: number): ReadonlyArray<SessionDistributionItem> {
  const completed = Math.round(totalSessions * 0.76)
  const cancelled = Math.round(totalSessions * 0.09)
  const failed = Math.round(totalSessions * 0.05)

  return [
    { status: "completed", label: "Completed", count: completed, percentage: 76 },
    { status: "cancelled", label: "Cancelled", count: cancelled, percentage: 9 },
    { status: "failed", label: "Failed", count: failed, percentage: 5 },
    { status: "in-progress", label: "In Progress", count: totalSessions - completed - cancelled - failed, percentage: 10 },
  ]
}

function deriveCustomSummary(points: ReadonlyArray<RevenueDataPoint>): StatisticsSummary {
  const totalRevenue = points.reduce((total, point) => total + point.revenue, 0)
  const totalSessions = points.reduce((total, point) => total + point.sessions, 0)

  return {
    totalRevenue,
    totalSessions,
    photosCaptured: Math.round(totalSessions * 4.62),
    averageSessionValue: totalSessions > 0 ? Math.round(totalRevenue / totalSessions) : 0,
    revenueChange: 5.6,
    sessionsChange: 3.8,
    photosChange: 7.2,
    averageValueChange: -1.1,
  }
}

export function getStatisticsPeriodData(
  period: StatisticsPeriod,
  customRange: StatisticsDateRange
): StatisticsPeriodData {
  if (period !== "custom") return statisticsDataByPeriod[period]

  const revenue = statisticsDataByPeriod["30-days"].revenue.filter(
    (point) => point.date >= customRange.from && point.date <= customRange.to
  )
  const summary = deriveCustomSummary(revenue)

  return {
    revenue,
    summary,
    distribution: calculateDistribution(summary.totalSessions),
  }
}

export function filterAndSortKiosks(
  items: ReadonlyArray<KioskPerformance>,
  query: string,
  status: KioskStatusFilter,
  sort: KioskSortOption
): ReadonlyArray<KioskPerformance> {
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID")
  const filtered = items.filter((item) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      item.name.toLocaleLowerCase("id-ID").includes(normalizedQuery) ||
      item.location.toLocaleLowerCase("id-ID").includes(normalizedQuery)
    return matchesQuery && (status === "all" || item.status === status)
  })

  return [...filtered].sort((first, second) => {
    if (sort === "sessions-desc") return second.sessions - first.sessions
    if (sort === "revenue-desc") return second.revenue - first.revenue
    if (sort === "uptime-desc") return second.uptimePercentage - first.uptimePercentage
    return first.name.localeCompare(second.name, "id-ID")
  })
}

export function paginateKiosks(
  items: ReadonlyArray<KioskPerformance>,
  pagination: KioskPaginationState
): ReadonlyArray<KioskPerformance> {
  const start = (pagination.page - 1) * pagination.pageSize
  return items.slice(start, start + pagination.pageSize)
}

export function getKioskTotalPages(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize))
}

export function getPeakHourInsight(points: ReadonlyArray<PeakHourDataPoint>): string {
  if (points.length === 0) return "Peak-hour insight is unavailable."
  if (points.length < 4) {
    const busiest = points.reduce((current, point) => point.sessions > current.sessions ? point : current)
    return `The busiest hour is ${busiest.hour}.`
  }

  let bestStartIndex = 0
  let bestTotal = -1

  for (let index = 0; index <= points.length - 4; index += 1) {
    const total = points.slice(index, index + 4).reduce((sum, point) => sum + point.sessions, 0)
    if (total > bestTotal) {
      bestTotal = total
      bestStartIndex = index
    }
  }

  return `Most sessions occur between ${points[bestStartIndex].hour} and ${points[bestStartIndex + 3].hour}.`
}

