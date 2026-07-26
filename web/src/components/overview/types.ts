export type OverviewPeriod = "today" | "7-days" | "30-days"

export type TrendDirection = "up" | "down" | "neutral"

export type SummaryMetricId =
  | "revenue"
  | "sessions"
  | "photos"
  | "average-duration"

interface SummaryMetricBase {
  readonly id: SummaryMetricId
  readonly label: string
  readonly trendDirection: TrendDirection
  readonly trendPercentage: number
  readonly trendLabel: string
}

export type SummaryMetric = SummaryMetricBase &
  (
    | { readonly format: "currency"; readonly value: number }
    | { readonly format: "integer"; readonly value: number }
    | { readonly format: "duration"; readonly value: number }
  )

export interface RevenueDataPoint {
  readonly date: string
  readonly revenue: number
  readonly sessions: number
}

export interface OverviewPeriodData {
  readonly metrics: ReadonlyArray<SummaryMetric>
  readonly revenue: ReadonlyArray<RevenueDataPoint>
}

export type DeviceStatus = "online" | "offline" | "warning"

export type HardwareStatus =
  | "connected"
  | "ready"
  | "disconnected"
  | "error"

export type PaymentStatus = "active" | "inactive"

export interface BoothStatus {
  readonly name: string
  readonly deviceStatus: DeviceStatus
  readonly cameraStatus: HardwareStatus
  readonly printerStatus: HardwareStatus
  readonly paymentStatus: PaymentStatus
  readonly lastSync: string
  readonly applicationVersion: string
  readonly storageUsedGb: number
  readonly storageTotalGb: number
}

export type TransactionStatus = "paid" | "pending" | "failed" | "refunded"

export type PaymentMethod = "qris" | "cash" | "debit-card" | "e-wallet"

export interface Transaction {
  readonly id: string
  readonly occurredAt: string
  readonly customer: string
  readonly packageName: string
  readonly paymentMethod: PaymentMethod
  readonly amount: number
  readonly status: TransactionStatus
}

export interface PopularFrame {
  readonly id: string
  readonly name: string
  readonly category: string
  readonly usageCount: number
  readonly usagePercentage: number
  readonly trendDirection: TrendDirection
  readonly trendPercentage: number
}

interface ActivityBase {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly timestamp: string
}

export type ActivityItem =
  | (ActivityBase & {
      readonly type: "payment"
      readonly transactionId: string
      readonly amount: number
    })
  | (ActivityBase & {
      readonly type: "frame"
      readonly frameName: string
    })
  | (ActivityBase & {
      readonly type: "printer"
      readonly printerStatus: Extract<HardwareStatus, "ready" | "error">
    })
  | (ActivityBase & {
      readonly type: "voucher"
      readonly voucherCode: string
    })
  | (ActivityBase & {
      readonly type: "sync"
      readonly recordsSynced: number
    })

export type ActivityType = ActivityItem["type"]

export type OperationalInsightType =
  | "peak-hour"
  | "popular-frame"
  | "payment-success"

export interface OperationalInsight {
  readonly id: string
  readonly type: OperationalInsightType
  readonly label: string
  readonly value: string
  readonly description: string
}

export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"

export interface StatusMeta {
  readonly label: string
  readonly variant: StatusBadgeVariant
}
