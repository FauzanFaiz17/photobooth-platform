export type BoothStatisticsPeriod = "day" | "week" | "month"
export type BoothDetailMetric = "revenue" | "photos" | "vouchers"
export type MetadataLeaderboardKey = "email" | "phone" | "name" | "rating"

export interface BoothChartPoint {
  readonly label: string
  readonly revenue: number
  readonly photos: number
  readonly sessions: number
  readonly vouchers: number
}

export interface BoothSummaryMetric {
  readonly id: "sessions" | "peak-day" | "prints" | "vouchers"
  readonly label: string
  readonly value: string
  readonly description: string
}

export interface BoothStatisticsRow {
  readonly id: string
  readonly name: string
  readonly transactionsToday: number
  readonly sessionsToday: number
  readonly revenue: number
}

export interface PopularFrameRow {
  readonly id: string
  readonly name: string
  readonly category: string
  readonly usageCount: number
  readonly usagePercentage: number
}

export interface MetadataLeaderboardRow {
  readonly id: string
  readonly email: string
  readonly phone: string
  readonly name: string
  readonly rating: number
  readonly total: number
}
