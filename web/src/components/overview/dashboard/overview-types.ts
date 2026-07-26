export type OverviewRange = "day" | "week" | "month"

export interface OverviewChartPoint {
  readonly label: string
  readonly revenue: number
}

export interface RevenueSummary {
  readonly total: number
  readonly trendPercentage: number
}

export interface KioskHealth {
  readonly id: string
  readonly name: string
  readonly status: "online" | "offline"
  readonly printerConnected: boolean
  readonly cameraConnected: boolean
  readonly printQueue: number
  readonly lastSeen: string
}

export interface BoothListItem {
  readonly id: string
  readonly name: string
  readonly transactionsToday: number
  readonly revenue: number
}

import type { TrendDirection } from "../types"

export interface OverviewStat {
  readonly id: "sessions" | "peak-day" | "prints" | "vouchers"
  readonly label: string
  readonly value: string
  readonly description: string
  readonly trendDirection?: TrendDirection
  readonly trendPercentage?: number
}
