import {
  CircleCheckBig,
  Clock3,
  GalleryHorizontalEnd,
  ImagePlus,
  PrinterCheck,
  RefreshCw,
  ShieldCheck,
  TicketCheck,
  type LucideIcon,
} from "lucide-react"

import type {
  ActivityType,
  DeviceStatus,
  HardwareStatus,
  OperationalInsightType,
  PaymentMethod,
  PaymentStatus,
  StatusMeta,
  SummaryMetric,
  TransactionStatus,
  TrendDirection,
} from "./types"

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const integerFormatter = new Intl.NumberFormat("id-ID")

const compactRupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 1,
})

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
})

const chartDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
})

export const formatRupiah = (value: number): string =>
  rupiahFormatter.format(value)

export const formatInteger = (value: number): string =>
  integerFormatter.format(value)

export const formatCompactRupiah = (value: number): string =>
  compactRupiahFormatter.format(value)

export const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`
}

export const formatDateTime = (isoDate: string): string =>
  dateTimeFormatter.format(new Date(isoDate))

const relativeTimeFormatter = new Intl.RelativeTimeFormat("id-ID", {
  numeric: "auto",
})

const relativeTimeDivisions = [
  { limit: 60, divisor: 1, unit: "second" },
  { limit: 3600, divisor: 60, unit: "minute" },
  { limit: 86_400, divisor: 3600, unit: "hour" },
  { limit: 604_800, divisor: 86_400, unit: "day" },
] satisfies ReadonlyArray<{
  limit: number
  divisor: number
  unit: Intl.RelativeTimeFormatUnit
}>

export const formatRelativeTime = (isoDate: string): string => {
  const elapsedSeconds = Math.round(
    (new Date(isoDate).getTime() - Date.now()) / 1000
  )
  const absoluteSeconds = Math.abs(elapsedSeconds)

  for (const division of relativeTimeDivisions) {
    if (absoluteSeconds < division.limit) {
      return relativeTimeFormatter.format(
        Math.trunc(elapsedSeconds / division.divisor),
        division.unit
      )
    }
  }

  return formatDateTime(isoDate)
}

export const formatChartDate = (isoDate: string): string =>
  chartDateFormatter.format(new Date(`${isoDate}T00:00:00+07:00`))

export const formatSummaryMetric = (metric: SummaryMetric): string => {
  switch (metric.format) {
    case "currency":
      return formatRupiah(metric.value)
    case "integer":
      return formatInteger(metric.value)
    case "duration":
      return formatDuration(metric.value)
  }
}

export const formatTrendPercentage = (
  direction: TrendDirection,
  percentage: number
): string => {
  if (direction === "neutral") return `${percentage}%`
  return `${direction === "up" ? "+" : "−"}${percentage}%`
}

const transactionStatusMeta = {
  paid: { label: "Paid", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "outline" },
} satisfies Record<TransactionStatus, StatusMeta>

const deviceStatusMeta = {
  online: { label: "Online", variant: "default" },
  offline: { label: "Offline", variant: "destructive" },
  warning: { label: "Needs attention", variant: "secondary" },
} satisfies Record<DeviceStatus, StatusMeta>

const hardwareStatusMeta = {
  connected: { label: "Connected", variant: "default" },
  ready: { label: "Ready", variant: "default" },
  disconnected: { label: "Disconnected", variant: "destructive" },
  error: { label: "Error", variant: "destructive" },
} satisfies Record<HardwareStatus, StatusMeta>

const paymentStatusMeta = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "destructive" },
} satisfies Record<PaymentStatus, StatusMeta>

const paymentMethodLabels = {
  qris: "QRIS",
  cash: "Cash",
  "debit-card": "Debit card",
  "e-wallet": "E-wallet",
} satisfies Record<PaymentMethod, string>

export const getTransactionStatusMeta = (
  status: TransactionStatus
): StatusMeta => transactionStatusMeta[status]

export const getDeviceStatusMeta = (status: DeviceStatus): StatusMeta =>
  deviceStatusMeta[status]

export const getHardwareStatusMeta = (status: HardwareStatus): StatusMeta =>
  hardwareStatusMeta[status]

export const getPaymentStatusMeta = (status: PaymentStatus): StatusMeta =>
  paymentStatusMeta[status]

export const getPaymentMethodLabel = (method: PaymentMethod): string =>
  paymentMethodLabels[method]

export const activityTypeMeta = {
  payment: { label: "Payment", icon: CircleCheckBig },
  frame: { label: "Frame", icon: ImagePlus },
  printer: { label: "Printer", icon: PrinterCheck },
  voucher: { label: "Voucher", icon: TicketCheck },
  sync: { label: "Sync", icon: RefreshCw },
} satisfies Record<ActivityType, { label: string; icon: LucideIcon }>

export const operationalInsightTypeMeta = {
  "peak-hour": { icon: Clock3 },
  "popular-frame": { icon: GalleryHorizontalEnd },
  "payment-success": { icon: ShieldCheck },
} satisfies Record<OperationalInsightType, { icon: LucideIcon }>
