import {
  kioskPerformanceData,
  peakHourData,
  statisticsDataByPeriod,
  templatePerformanceData,
} from "../data/statistics-data"
import type {
  BoothChartPoint,
  BoothStatisticsPeriod,
  BoothStatisticsRow,
  BoothSummaryMetric,
  MetadataLeaderboardRow,
  PopularFrameRow,
} from "./statistics-booth.types"

export const boothPeriodLabels: Record<BoothStatisticsPeriod, string> = {
  day: "Hari",
  week: "Minggu",
  month: "Bulan",
}

export const boothStatisticsRows: ReadonlyArray<BoothStatisticsRow> =
  kioskPerformanceData.map((kiosk, index) => ({
    id: kiosk.id,
    name: kiosk.name,
    transactionsToday: [31, 27, 22, 18, 12][index] ?? 0,
    sessionsToday: [29, 25, 20, 17, 10][index] ?? 0,
    revenue: kiosk.revenue,
  }))

export const popularFrames: ReadonlyArray<PopularFrameRow> =
  templatePerformanceData.map((frame) => ({
    id: frame.id,
    name: frame.name,
    category: frame.category,
    usageCount: frame.usageCount,
    usagePercentage: frame.usagePercentage,
  }))

export const metadataLeaderboard: ReadonlyArray<MetadataLeaderboardRow> = [
  { id: "META-001", email: "alya@example.com", phone: "0812 4400 1288", name: "Alya Putri", rating: 5, total: 18 },
  { id: "META-002", email: "naya@example.com", phone: "0813 5521 9087", name: "Naya Sari", rating: 5, total: 16 },
  { id: "META-003", email: "raka@example.com", phone: "0857 1140 2291", name: "Raka Ardi", rating: 4.9, total: 14 },
  { id: "META-004", email: "nadya@example.com", phone: "0821 7620 4415", name: "Nadya Sari", rating: 4.8, total: 12 },
  { id: "META-005", email: "dimas@example.com", phone: "0819 3308 7712", name: "Dimas Ardi", rating: 4.8, total: 10 },
]

function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(
    new Date(`${date}T00:00:00+07:00`)
  )
}

export function getBoothChartData(period: BoothStatisticsPeriod): ReadonlyArray<BoothChartPoint> {
  if (period === "day") {
    return peakHourData.map((point, index) => ({
      label: point.hour,
      revenue: point.sessions * 15_000,
      photos: point.sessions * 4,
      sessions: point.sessions,
      vouchers: index % 3 === 0 ? Math.max(1, Math.round(point.sessions * 0.12)) : 0,
    }))
  }

  const source = period === "week"
    ? statisticsDataByPeriod["7-days"].revenue
    : statisticsDataByPeriod["30-days"].revenue

  return source.map((point, index) => ({
    label: formatDayLabel(point.date),
    revenue: point.revenue,
    photos: point.sessions * 4,
    sessions: point.sessions,
    vouchers: Math.max(1, Math.round(point.sessions * (index % 2 === 0 ? 0.16 : 0.11))),
  }))
}

export function getBoothPeriodLabel(date: string, period: BoothStatisticsPeriod): string {
  const endDate = new Date(`${date}T00:00:00+07:00`)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - (period === "day" ? 0 : period === "week" ? 6 : 29))
  const formatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" })
  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`
}

export function getBoothSummary(
  date: string,
  period: BoothStatisticsPeriod
): ReadonlyArray<BoothSummaryMetric> {
  const data = getBoothChartData(period)
  const periodLabel = getBoothPeriodLabel(date, period)
  const totalSessions = data.reduce((sum, point) => sum + point.sessions, 0)
  const totalPrints = data.reduce((sum, point) => sum + point.photos, 0)
  const totalVouchers = data.reduce((sum, point) => sum + point.vouchers, 0)
  const peakPoint = data.reduce((peak, point) => point.sessions > peak.sessions ? point : peak)

  return [
    { id: "sessions", label: "Sesi", value: totalSessions.toLocaleString("id-ID"), description: periodLabel },
    { id: "peak-day", label: "Hari Puncak", value: peakPoint.label, description: `${peakPoint.sessions} sesi` },
    { id: "prints", label: "Cetakan", value: totalPrints.toLocaleString("id-ID"), description: "total cetakan" },
    { id: "vouchers", label: "Voucher", value: totalVouchers.toLocaleString("id-ID"), description: "sesi voucher" },
  ]
}

export function getRevenueTotal(period: BoothStatisticsPeriod): number {
  return getBoothChartData(period).reduce((sum, point) => sum + point.revenue, 0)
}
