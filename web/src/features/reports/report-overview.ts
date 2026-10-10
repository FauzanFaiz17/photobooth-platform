import type {
  PartnerDailyReport,
  PartnerMonthlyReport,
} from "./report.types"

export interface OverviewSeriesPoint {
  readonly key: string
  readonly period: string
  readonly revenue: number
  readonly sessions: number
  readonly prints: number
  readonly downloads: number
}

export interface PartnerRankingEntry {
  readonly partnerId: number
  readonly revenue: number
}

interface Totals {
  revenue: number
  sessions: number
  prints: number
  downloads: number
}

function emptyTotals(): Totals {
  return { revenue: 0, sessions: 0, prints: 0, downloads: 0 }
}

function addDailyRow(totals: Totals, row: PartnerDailyReport): void {
  totals.revenue += Number(row.total_revenue) || 0
  totals.sessions += row.total_sessions
  totals.prints += row.total_prints
  totals.downloads += row.total_downloads
}

function addMonthlyRow(totals: Totals, row: PartnerMonthlyReport): void {
  totals.revenue += Number(row.total_revenue) || 0
  totals.sessions += row.total_sessions
  totals.prints += row.total_prints
  totals.downloads += row.total_downloads
}

function toPoint(key: string, label: string, totals: Totals): OverviewSeriesPoint {
  return {
    key,
    period: label,
    revenue: Math.round(totals.revenue * 100) / 100,
    sessions: totals.sessions,
    prints: totals.prints,
    downloads: totals.downloads,
  }
}

function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function shiftISODate(value: string, days: number): string {
  const date = parseISODate(value)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

function isoWeek(date: Date): { year: number; week: number } {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: target.getUTCFullYear(), week }
}

function weekKey(value: string): { key: string; label: string } {
  const { year, week } = isoWeek(parseISODate(value))
  const padded = String(week).padStart(2, "0")
  return { key: `${year}-W${padded}`, label: `M${week}` }
}

function dayLabel(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    parseISODate(value)
  )
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

function monthLabel(year: number, month: number): string {
  const label = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
    new Date(year, month - 1, 1)
  )
  return `${label} ${String(year).slice(2)}`
}

export function buildDailySeries(
  rows: ReadonlyArray<PartnerDailyReport>,
  days: number
): ReadonlyArray<OverviewSeriesPoint> {
  if (rows.length === 0) return []

  const byDate = new Map<string, Totals>()
  for (const row of rows) {
    const totals = byDate.get(row.stat_date) ?? emptyTotals()
    addDailyRow(totals, row)
    byDate.set(row.stat_date, totals)
  }

  const anchor = rows.reduce(
    (latest, row) => (row.stat_date > latest ? row.stat_date : latest),
    rows[0].stat_date
  )

  const points: OverviewSeriesPoint[] = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const key = shiftISODate(anchor, -offset)
    points.push(toPoint(key, dayLabel(key), byDate.get(key) ?? emptyTotals()))
  }
  return points
}

export function buildWeeklySeries(
  rows: ReadonlyArray<PartnerDailyReport>,
  weeks: number
): ReadonlyArray<OverviewSeriesPoint> {
  if (rows.length === 0) return []

  const byWeek = new Map<string, Totals>()
  for (const row of rows) {
    const { key } = weekKey(row.stat_date)
    const totals = byWeek.get(key) ?? emptyTotals()
    addDailyRow(totals, row)
    byWeek.set(key, totals)
  }

  const anchor = rows.reduce(
    (latest, row) => (row.stat_date > latest ? row.stat_date : latest),
    rows[0].stat_date
  )

  const points: OverviewSeriesPoint[] = []
  for (let offset = weeks - 1; offset >= 0; offset -= 1) {
    const date = shiftISODate(anchor, -offset * 7)
    const { key, label } = weekKey(date)
    points.push(toPoint(key, label, byWeek.get(key) ?? emptyTotals()))
  }
  return points
}

export function buildMonthlySeries(
  rows: ReadonlyArray<PartnerMonthlyReport>,
  months: number
): ReadonlyArray<OverviewSeriesPoint> {
  if (rows.length === 0) return []

  const byMonth = new Map<string, Totals>()
  for (const row of rows) {
    const key = monthKey(row.period_year, row.period_month)
    const totals = byMonth.get(key) ?? emptyTotals()
    addMonthlyRow(totals, row)
    byMonth.set(key, totals)
  }

  const latest = rows.reduce((max, row) => {
    const key = monthKey(row.period_year, row.period_month)
    return key > max ? key : max
  }, monthKey(rows[0].period_year, rows[0].period_month))

  const [latestYear, latestMonth] = latest.split("-").map(Number)

  const points: OverviewSeriesPoint[] = []
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(latestYear, latestMonth - 1 - offset, 1)
    const key = monthKey(date.getFullYear(), date.getMonth() + 1)
    const label = monthLabel(date.getFullYear(), date.getMonth() + 1)
    points.push(toPoint(key, label, byMonth.get(key) ?? emptyTotals()))
  }
  return points
}

export function rankPartnersByRevenue(
  rows: ReadonlyArray<{ readonly partner_id: number; readonly total_revenue: string }>
): ReadonlyArray<PartnerRankingEntry> {
  const totals = new Map<number, number>()
  for (const row of rows) {
    totals.set(row.partner_id, (totals.get(row.partner_id) ?? 0) + (Number(row.total_revenue) || 0))
  }

  return [...totals.entries()]
    .map(([partnerId, revenue]) => ({ partnerId, revenue: Math.round(revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
}
