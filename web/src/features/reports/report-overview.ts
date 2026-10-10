import type { PaymentRecord } from "@/features/payments/payment.types"

export type OverviewPeriod = "daily" | "weekly" | "monthly"

/** Baris chart: `key`/`period` + satu kolom per partner (mis. `p10`). */
export interface OverviewChartRow {
  readonly key: string
  readonly period: string
  readonly [partnerValue: string]: number | string
}

export interface PartnerRankingEntry {
  readonly partnerId: number
  readonly revenue: number
}

const DAILY_DAYS = 30
const WEEKLY_WEEKS = 12
const MONTHLY_MONTHS = 12

export function partnerValueKey(partnerId: number): string {
  return `p${partnerId}`
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

/**
 * Ambil "YYYY-MM-DD" dari tanggal/datetime apa pun
 * (mis. "2026-10-09T00:00:00.000000Z").
 */
export function normalizeDate(value: string | null): string | null {
  if (!value) return null
  return value.slice(0, 10)
}

function shiftISODate(value: string, days: number): string {
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

function dayLabel(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    parseISODate(value)
  )
}

function monthLabel(year: number, month: number): string {
  const label = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
    new Date(year, month - 1, 1)
  )
  return `${label} ${String(year).slice(2)}`
}

function bucketKey(date: string, period: OverviewPeriod): string {
  if (period === "daily") return date
  if (period === "monthly") return date.slice(0, 7)
  const { year, week } = isoWeek(parseISODate(date))
  return `${year}-W${String(week).padStart(2, "0")}`
}

function periodBuckets(
  period: OverviewPeriod,
  today: Date
): ReadonlyArray<{ key: string; label: string }> {
  const buckets: { key: string; label: string }[] = []

  if (period === "daily") {
    const end = toISODate(today)
    for (let offset = DAILY_DAYS - 1; offset >= 0; offset -= 1) {
      const key = shiftISODate(end, -offset)
      buckets.push({ key, label: dayLabel(key) })
    }
    return buckets
  }

  if (period === "weekly") {
    const end = toISODate(today)
    for (let offset = WEEKLY_WEEKS - 1; offset >= 0; offset -= 1) {
      const date = shiftISODate(end, -offset * 7)
      const { year, week } = isoWeek(parseISODate(date))
      buckets.push({
        key: `${year}-W${String(week).padStart(2, "0")}`,
        label: `M${week}`,
      })
    }
    return buckets
  }

  for (let offset = MONTHLY_MONTHS - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1)
    buckets.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: monthLabel(date.getFullYear(), date.getMonth() + 1),
    })
  }
  return buckets
}

/** Awal window (YYYY-MM-DD) — dipakai untuk menghentikan paginasi. */
export function windowStart(period: OverviewPeriod, today = new Date()): string {
  if (period === "daily") {
    return shiftISODate(toISODate(today), -(DAILY_DAYS - 1))
  }
  if (period === "weekly") {
    return shiftISODate(toISODate(today), -(WEEKLY_WEEKS * 7 - 1))
  }
  return toISODate(new Date(today.getFullYear(), today.getMonth() - (MONTHLY_MONTHS - 1), 1))
}

type Entries = ReadonlyArray<{ date: string; partnerId: number; value: number }>

function buildRows(
  entries: Entries,
  partnerIds: ReadonlyArray<number>,
  period: OverviewPeriod,
  today: Date
): ReadonlyArray<OverviewChartRow> {
  const buckets = new Map<string, Map<number, number>>()

  for (const entry of entries) {
    const key = bucketKey(entry.date, period)
    const perPartner = buckets.get(key) ?? new Map<number, number>()
    perPartner.set(entry.partnerId, (perPartner.get(entry.partnerId) ?? 0) + entry.value)
    buckets.set(key, perPartner)
  }

  return periodBuckets(period, today).map(({ key, label }) => {
    const row: Record<string, number | string> = { key, period: label }
    const perPartner = buckets.get(key)
    for (const partnerId of partnerIds) {
      row[partnerValueKey(partnerId)] =
        Math.round((perPartner?.get(partnerId) ?? 0) * 100) / 100
    }
    return row as OverviewChartRow
  })
}

export function buildRevenueRows(
  payments: ReadonlyArray<PaymentRecord>,
  partnerIds: ReadonlyArray<number>,
  period: OverviewPeriod,
  today = new Date()
): ReadonlyArray<OverviewChartRow> {
  const entries: { date: string; partnerId: number; value: number }[] = []
  for (const payment of payments) {
    const date = normalizeDate(payment.paid_at)
    if (!date) continue
    entries.push({ date, partnerId: payment.partner_id, value: payment.amount })
  }
  return buildRows(entries, partnerIds, period, today)
}

/** Jumlah pembayaran (payment) per partner per periode. */
export function buildPaymentCountRows(
  payments: ReadonlyArray<PaymentRecord>,
  partnerIds: ReadonlyArray<number>,
  period: OverviewPeriod,
  today = new Date()
): ReadonlyArray<OverviewChartRow> {
  const entries: { date: string; partnerId: number; value: number }[] = []
  for (const payment of payments) {
    const date = normalizeDate(payment.paid_at)
    if (!date) continue
    entries.push({ date, partnerId: payment.partner_id, value: 1 })
  }
  return buildRows(entries, partnerIds, period, today)
}

export function rankPartnersByRevenue(
  payments: ReadonlyArray<PaymentRecord>
): ReadonlyArray<PartnerRankingEntry> {
  const totals = new Map<number, number>()
  for (const payment of payments) {
    totals.set(payment.partner_id, (totals.get(payment.partner_id) ?? 0) + payment.amount)
  }

  return [...totals.entries()]
    .map(([partnerId, revenue]) => ({ partnerId, revenue: Math.round(revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
}
