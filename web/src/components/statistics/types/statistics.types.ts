export type StatisticsPeriod = "7-days" | "30-days" | "90-days" | "custom"

export type StatisticsChartMetric = "revenue" | "sessions"

export type StatisticsTrendDirection = "up" | "down" | "neutral"

export type StatisticsSummaryMetricId =
  | "revenue"
  | "sessions"
  | "photos"
  | "average-value"

export type StatisticsSummaryValueKind = "currency" | "integer"

export interface StatisticsSummaryMetric {
  readonly id: StatisticsSummaryMetricId
  readonly label: string
  readonly value: number
  readonly valueKind: StatisticsSummaryValueKind
  readonly changePercentage: number
  readonly trend: StatisticsTrendDirection
  readonly comparisonLabel: string
  readonly tooltip: string
}

export interface StatisticsSummary {
  readonly totalRevenue: number
  readonly totalSessions: number
  readonly photosCaptured: number
  readonly averageSessionValue: number
  readonly revenueChange: number
  readonly sessionsChange: number
  readonly photosChange: number
  readonly averageValueChange: number
}

export interface RevenueDataPoint {
  readonly date: string
  readonly revenue: number
  readonly sessions: number
}

export type SessionStatus = "completed" | "cancelled" | "failed" | "in-progress"

export interface SessionDistributionItem {
  readonly status: SessionStatus
  readonly label: string
  readonly count: number
  readonly percentage: number
}

export type KioskStatus = "online" | "offline" | "maintenance"

export interface KioskPerformance {
  readonly id: string
  readonly name: string
  readonly location: string
  readonly sessions: number
  readonly revenue: number
  readonly uptimePercentage: number
  readonly status: KioskStatus
  readonly lastActiveAt: string
}

export type KioskStatusFilter = KioskStatus | "all"

export type KioskSortOption =
  | "sessions-desc"
  | "revenue-desc"
  | "uptime-desc"
  | "name-asc"

export interface TemplatePerformance {
  readonly id: string
  readonly name: string
  readonly category: string
  readonly usageCount: number
  readonly usagePercentage: number
}

export interface PeakHourDataPoint {
  readonly hour: string
  readonly sessions: number
}

export type StatisticsActivityType =
  | "session"
  | "revenue"
  | "kiosk"
  | "template"
  | "report"

export type StatisticsActivityStatus = "success" | "warning" | "information"

export interface StatisticsActivity {
  readonly id: string
  readonly type: StatisticsActivityType
  readonly title: string
  readonly description: string
  readonly occurredAt: string
  readonly status?: StatisticsActivityStatus
}

export interface StatisticsDateRange {
  readonly from: string
  readonly to: string
}

export interface StatisticsPeriodData {
  readonly summary: StatisticsSummary
  readonly revenue: ReadonlyArray<RevenueDataPoint>
  readonly distribution: ReadonlyArray<SessionDistributionItem>
}

export interface KioskPaginationState {
  readonly page: number
  readonly pageSize: 3 | 5
}

