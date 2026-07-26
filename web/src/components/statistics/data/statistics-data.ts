import type {
  KioskPerformance,
  PeakHourDataPoint,
  SessionDistributionItem,
  StatisticsActivity,
  StatisticsPeriod,
  StatisticsPeriodData,
  StatisticsSummary,
  TemplatePerformance,
  RevenueDataPoint,
} from "../types/statistics.types"

export const statisticsPeriods = [
  { value: "7-days", label: "Last 7 days" },
  { value: "30-days", label: "Last 30 days" },
  { value: "90-days", label: "Last 90 days" },
  { value: "custom", label: "Custom range" },
] satisfies ReadonlyArray<{ readonly value: StatisticsPeriod; readonly label: string }>

export const defaultCustomDateRange = {
  from: "2026-07-01",
  to: "2026-07-15",
} as const

const dailyPattern = [0.82, 0.94, 1.03, 1.12, 1.24, 1.36, 0.91] as const

function createRevenueSeries(
  startDate: string,
  days: number,
  baseRevenue: number,
  offset: number
): ReadonlyArray<RevenueDataPoint> {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(`${startDate}T00:00:00+07:00`)
    date.setDate(date.getDate() + index)
    const pattern = dailyPattern[(index + offset) % dailyPattern.length]
    const activityAdjustment = ((index * 37 + offset * 11) % 9) * 18_000
    const revenue = Math.round((baseRevenue * pattern + activityAdjustment) / 1_000) * 1_000

    return {
      date: date.toISOString().slice(0, 10),
      revenue,
      sessions: Math.max(1, Math.round(revenue / 15_024)),
    }
  })
}

function createDistribution(totalSessions: number): ReadonlyArray<SessionDistributionItem> {
  const completed = Math.round(totalSessions * 0.76)
  const cancelled = Math.round(totalSessions * 0.09)
  const failed = Math.round(totalSessions * 0.05)

  return [
    { status: "completed", label: "Completed", count: completed, percentage: 76 },
    { status: "cancelled", label: "Cancelled", count: cancelled, percentage: 9 },
    { status: "failed", label: "Failed", count: failed, percentage: 5 },
    {
      status: "in-progress",
      label: "In Progress",
      count: totalSessions - completed - cancelled - failed,
      percentage: 10,
    },
  ]
}

const summaries = {
  "7-days": {
    totalRevenue: 4_680_000,
    totalSessions: 306,
    photosCaptured: 1_412,
    averageSessionValue: 15_294,
    revenueChange: 6.8,
    sessionsChange: 4.1,
    photosChange: 9.6,
    averageValueChange: 1.4,
  },
  "30-days": {
    totalRevenue: 18_750_000,
    totalSessions: 1_248,
    photosCaptured: 5_764,
    averageSessionValue: 15_024,
    revenueChange: 12.5,
    sessionsChange: 8.2,
    photosChange: 15.3,
    averageValueChange: -2.1,
  },
  "90-days": {
    totalRevenue: 52_940_000,
    totalSessions: 3_482,
    photosCaptured: 16_108,
    averageSessionValue: 15_204,
    revenueChange: 18.7,
    sessionsChange: 14.9,
    photosChange: 20.4,
    averageValueChange: 3.3,
  },
} satisfies Record<Exclude<StatisticsPeriod, "custom">, StatisticsSummary>

const periodSeries = {
  "7-days": createRevenueSeries("2026-07-09", 7, 650_000, 1),
  "30-days": createRevenueSeries("2026-06-16", 30, 610_000, 2),
  "90-days": createRevenueSeries("2026-04-17", 90, 575_000, 3),
} satisfies Record<Exclude<StatisticsPeriod, "custom">, ReadonlyArray<RevenueDataPoint>>

export const statisticsDataByPeriod = {
  "7-days": {
    summary: summaries["7-days"],
    revenue: periodSeries["7-days"],
    distribution: createDistribution(summaries["7-days"].totalSessions),
  },
  "30-days": {
    summary: summaries["30-days"],
    revenue: periodSeries["30-days"],
    distribution: createDistribution(summaries["30-days"].totalSessions),
  },
  "90-days": {
    summary: summaries["90-days"],
    revenue: periodSeries["90-days"],
    distribution: createDistribution(summaries["90-days"].totalSessions),
  },
} satisfies Record<Exclude<StatisticsPeriod, "custom">, StatisticsPeriodData>

export const kioskPerformanceData = [
  { id: "kiosk-garut-kota", name: "Kiosk Garut Kota", location: "Garut Kota", sessions: 382, revenue: 5_740_000, uptimePercentage: 99.8, status: "online", lastActiveAt: "2026-07-15T22:48:00+07:00" },
  { id: "kiosk-tarogong", name: "Kiosk Tarogong", location: "Tarogong Kidul", sessions: 296, revenue: 4_420_000, uptimePercentage: 98.6, status: "online", lastActiveAt: "2026-07-15T22:44:00+07:00" },
  { id: "kiosk-bandung", name: "Kiosk Bandung", location: "Bandung Wetan", sessions: 254, revenue: 3_860_000, uptimePercentage: 97.4, status: "maintenance", lastActiveAt: "2026-07-15T21:18:00+07:00" },
  { id: "kiosk-tasikmalaya", name: "Kiosk Tasikmalaya", location: "Cihideung", sessions: 184, revenue: 2_780_000, uptimePercentage: 95.9, status: "online", lastActiveAt: "2026-07-15T22:35:00+07:00" },
  { id: "kiosk-cianjur", name: "Kiosk Cianjur", location: "Cianjur Kota", sessions: 132, revenue: 1_950_000, uptimePercentage: 88.2, status: "offline", lastActiveAt: "2026-07-15T19:02:00+07:00" },
] satisfies ReadonlyArray<KioskPerformance>

export const templatePerformanceData = [
  { id: "template-classic-white", name: "Classic White", category: "Minimal", usageCount: 384, usagePercentage: 31 },
  { id: "template-graduation-day", name: "Graduation Day", category: "Graduation", usageCount: 286, usagePercentage: 23 },
  { id: "template-vintage-film", name: "Vintage Film", category: "Retro", usageCount: 211, usagePercentage: 17 },
  { id: "template-wedding-minimal", name: "Wedding Minimal", category: "Wedding", usageCount: 198, usagePercentage: 16 },
  { id: "template-birthday-party", name: "Birthday Party", category: "Celebration", usageCount: 169, usagePercentage: 13 },
] satisfies ReadonlyArray<TemplatePerformance>

export const peakHourData = [
  { hour: "08:00", sessions: 18 }, { hour: "09:00", sessions: 24 },
  { hour: "10:00", sessions: 31 }, { hour: "11:00", sessions: 39 },
  { hour: "12:00", sessions: 46 }, { hour: "13:00", sessions: 52 },
  { hour: "14:00", sessions: 57 }, { hour: "15:00", sessions: 68 },
  { hour: "16:00", sessions: 79 }, { hour: "17:00", sessions: 104 },
  { hour: "18:00", sessions: 121 }, { hour: "19:00", sessions: 116 },
  { hour: "20:00", sessions: 98 }, { hour: "21:00", sessions: 63 },
  { hour: "22:00", sessions: 36 },
] satisfies ReadonlyArray<PeakHourDataPoint>

export const statisticsActivities = [
  { id: "activity-session-1248", type: "session", title: "Session completed", description: "SES-20260715-048 completed at Kiosk Garut Kota.", occurredAt: "2026-07-15T22:48:00+07:00", status: "success" },
  { id: "activity-revenue-18750", type: "revenue", title: "New revenue recorded", description: "Rp75.000 was added from three completed sessions.", occurredAt: "2026-07-15T22:31:00+07:00", status: "success" },
  { id: "activity-kiosk-cianjur", type: "kiosk", title: "Kiosk became offline", description: "Kiosk Cianjur has not sent a heartbeat for 12 minutes.", occurredAt: "2026-07-15T19:02:00+07:00", status: "warning" },
  { id: "activity-template-classic", type: "template", title: "Template milestone reached", description: "Classic White passed 350 uses this month.", occurredAt: "2026-07-15T17:45:00+07:00", status: "information" },
  { id: "activity-report-july", type: "report", title: "Report exported", description: "The July performance summary was prepared for export.", occurredAt: "2026-07-15T16:20:00+07:00", status: "information" },
] satisfies ReadonlyArray<StatisticsActivity>

