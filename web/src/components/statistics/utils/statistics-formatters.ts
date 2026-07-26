import type {
  StatisticsDateRange,
  StatisticsPeriod,
  StatisticsSummary,
  StatisticsSummaryMetric,
  StatisticsTrendDirection,
} from "../types/statistics.types"

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const compactRupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 1,
})

const integerFormatter = new Intl.NumberFormat("id-ID")

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatRupiah(value: number): string {
  return rupiahFormatter.format(value)
}

export function formatCompactRupiah(value: number): string {
  return compactRupiahFormatter.format(value)
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value)
}

export function formatPercentage(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value))
}

export function formatShortDate(value: string): string {
  return shortDateFormatter.format(new Date(value))
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value))
}

export function formatPeriodLabel(
  period: StatisticsPeriod,
  customRange: StatisticsDateRange
): string {
  if (period === "7-days") return "Last 7 days"
  if (period === "30-days") return "Last 30 days"
  if (period === "90-days") return "Last 90 days"
  return `${formatDate(customRange.from)} – ${formatDate(customRange.to)}`
}

function getTrend(value: number): StatisticsTrendDirection {
  if (value > 0) return "up"
  if (value < 0) return "down"
  return "neutral"
}

export function createSummaryMetrics(
  summary: StatisticsSummary
): ReadonlyArray<StatisticsSummaryMetric> {
  return [
    {
      id: "revenue",
      label: "Total Revenue",
      value: summary.totalRevenue,
      valueKind: "currency",
      changePercentage: summary.revenueChange,
      trend: getTrend(summary.revenueChange),
      comparisonLabel: "compared with previous period",
      tooltip: "Gross revenue recorded from completed photobooth sessions.",
    },
    {
      id: "sessions",
      label: "Total Sessions",
      value: summary.totalSessions,
      valueKind: "integer",
      changePercentage: summary.sessionsChange,
      trend: getTrend(summary.sessionsChange),
      comparisonLabel: "compared with previous period",
      tooltip: "All photobooth sessions started during the selected period.",
    },
    {
      id: "photos",
      label: "Photos Captured",
      value: summary.photosCaptured,
      valueKind: "integer",
      changePercentage: summary.photosChange,
      trend: getTrend(summary.photosChange),
      comparisonLabel: "compared with previous period",
      tooltip: "Total photo captures, including retakes and selected outputs.",
    },
    {
      id: "average-value",
      label: "Average Session Value",
      value: summary.averageSessionValue,
      valueKind: "currency",
      changePercentage: summary.averageValueChange,
      trend: getTrend(summary.averageValueChange),
      comparisonLabel: "compared with previous period",
      tooltip: "Average recorded revenue for each completed session.",
    },
  ]
}

