import type {
  BoothListItem,
  KioskHealth,
  OverviewChartPoint,
  OverviewRange,
  OverviewStat,
  RevenueSummary,
} from "./overview-types"

import { overviewDataByPeriod } from "../data"
import {
  kioskIdentity,
  kioskPrintSettings,
} from "@/components/kiosk/data/kiosk-dummy-data"

export const kioskHealth: ReadonlyArray<KioskHealth> = [
  {
    id: kioskIdentity.id,
    name: kioskIdentity.name,
    status: kioskIdentity.status,
    printerConnected: kioskPrintSettings.printerStatus === "ready",
    cameraConnected: true,
    printQueue: kioskPrintSettings.queueCount,
    lastSeen: "baru saja",
  },
  {
    id: "KSK-002",
    name: "AMEHO",
    status: "online",
    printerConnected: true,
    cameraConnected: true,
    printQueue: 1,
    lastSeen: "1 menit yang lalu",
  },
  {
    id: "KSK-003",
    name: "Booth Sudirman",
    status: "online",
    printerConnected: true,
    cameraConnected: true,
    printQueue: 0,
    lastSeen: "3 menit yang lalu",
  },
  {
    id: "KSK-004",
    name: "Booth Kemang",
    status: "offline",
    printerConnected: false,
    cameraConnected: false,
    printQueue: 0,
    lastSeen: "2 jam yang lalu",
  },
]

export const boothList: ReadonlyArray<BoothListItem> = [
  { id: "KSK-001", name: "Main Studio Booth", transactionsToday: 31, revenue: 420_000 },
  { id: "KSK-002", name: "AMEHO", transactionsToday: 27, revenue: 365_000 },
  { id: "KSK-003", name: "Booth Sudirman", transactionsToday: 24, revenue: 330_000 },
  { id: "KSK-004", name: "Booth Kemang", transactionsToday: 19, revenue: 285_000 },
  { id: "KSK-005", name: "Booth Blok M", transactionsToday: 17, revenue: 255_000 },
  { id: "KSK-006", name: "Booth Senayan", transactionsToday: 15, revenue: 225_000 },
  { id: "KSK-007", name: "Booth Kuningan", transactionsToday: 13, revenue: 195_000 },
  { id: "KSK-008", name: "Booth Cikini", transactionsToday: 11, revenue: 165_000 },
]

export const rangeLabels: Record<OverviewRange, string> = {
  day: "Hari",
  week: "Minggu",
  month: "Bulan",
}

const rangeLength: Record<OverviewRange, number> = {
  day: 24,
  week: 7,
  month: 30,
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

export function formatDisplayDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDate(value))
}

export function getPeriodLabel(value: string, range: OverviewRange): string {
  const endDate = parseDate(value)
  const startDate = new Date(endDate)
  const offset = range === "day" ? 0 : rangeLength[range] - 1
  startDate.setDate(startDate.getDate() - offset)

  return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`
}

const hourlyRevenue = [
  0, 0, 0, 0, 0, 0, 0, 0, 12_000, 18_000, 25_000, 31_000,
  28_000, 35_000, 42_000, 38_000, 45_000, 36_000, 52_000, 58_000,
  0, 0, 0, 0,
]

function getRangeRevenue(range: OverviewRange): ReadonlyArray<number> {
  if (range === "day") return hourlyRevenue
  const source = range === "week"
    ? overviewDataByPeriod["7-days"].revenue
    : overviewDataByPeriod["30-days"].revenue
  return source.map((point) => point.revenue)
}

export function buildRevenueData(
  value: string,
  range: OverviewRange
): ReadonlyArray<OverviewChartPoint> {
  const selectedDate = parseDate(value)
  const revenue = getRangeRevenue(range)

  if (range === "day") {
    return Array.from({ length: rangeLength.day }, (_, index) => ({
      label: `${String(index).padStart(2, "0")}:00`,
      revenue: revenue[index],
    }))
  }

  return Array.from({ length: rangeLength[range] }, (_, index) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - (rangeLength[range] - 1 - index))
    return {
      label: String(date.getDate()).padStart(2, "0"),
      revenue: revenue[index],
    }
  })
}

export function getRevenueSummary(range: OverviewRange): RevenueSummary {
  const periodKey = range === "day"
    ? "today"
    : range === "week"
      ? "7-days"
      : "30-days"
  const metric = overviewDataByPeriod[periodKey].metrics.find(
    (item) => item.id === "revenue"
  )

  return {
    total: getRangeRevenue(range).reduce((sum, value) => sum + value, 0),
    trendPercentage: metric?.trendPercentage ?? 0,
  }
}

export function getOverviewStats(
  date: string,
  range: OverviewRange
): ReadonlyArray<OverviewStat> {
  const selectedDate = parseDate(date)
  const periodKey = range === "day"
    ? "today"
    : range === "week"
      ? "7-days"
      : "30-days"
  const periodData = overviewDataByPeriod[periodKey]
  const sessionsMetric = periodData.metrics.find((item) => item.id === "sessions")
  const printsMetric = periodData.metrics.find((item) => item.id === "photos")
  const sessions = sessionsMetric?.value ?? 0
  const prints = printsMetric?.value ?? 0
  const peakIndex = getRangeRevenue(range).reduce(
    (bestIndex, value, index, values) => value > values[bestIndex] ? index : bestIndex,
    0
  )
  const peakDate = new Date(selectedDate)
  peakDate.setDate(peakDate.getDate() - (rangeLength[range] - 1 - peakIndex))
  const peakValue = range === "day"
    ? `${String(peakIndex).padStart(2, "0")}:00`
    : range === "week"
      ? new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(peakDate)
      : formatShortDate(peakDate)
  const peakSessions = range === "day" ? 6 : range === "week" ? 34 : 35
  const vouchers = range === "day" ? 5 : range === "week" ? 28 : 116

  return [
    {
      id: "sessions",
      label: "Sesi",
      value: sessions.toLocaleString("id-ID"),
      description: "sesi selesai",
      trendDirection: sessionsMetric?.trendDirection,
      trendPercentage: sessionsMetric?.trendPercentage,
    },
    {
      id: "peak-day",
      label: "Hari Puncak",
      value: peakValue,
      description: `${peakSessions} sesi`,
    },
    {
      id: "prints",
      label: "Cetakan",
      value: prints.toLocaleString("id-ID"),
      description: "total cetakan",
      trendDirection: printsMetric?.trendDirection,
      trendPercentage: printsMetric?.trendPercentage,
    },
    {
      id: "vouchers",
      label: "Voucher",
      value: vouchers.toLocaleString("id-ID"),
      description: "sesi voucher",
    },
  ]
}
