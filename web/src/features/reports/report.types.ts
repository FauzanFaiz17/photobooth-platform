export interface ReportPageMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface PartnerDailyReport {
  id: number
  partner_id: number
  stat_date: string
  total_revenue: string
  total_sessions: number
  total_customers: number
  total_prints: number
  total_downloads: number
}

export interface PartnerMonthlyReport {
  id: number
  partner_id: number
  period_year: number
  period_month: number
  total_revenue: string
  total_sessions: number
  total_customers: number
  total_vouchers_used: number
  total_qris_transactions: number
  total_prints: number
  total_downloads: number
  total_media: number
  generated_at: string
}

export interface AdminDailyReport {
  id: number
  stat_date: string
  total_partners: number
  total_booths: number
  total_devices: number
  total_events: number
  total_sessions: number
  total_payments: number
  total_media: number
  total_print_jobs: number
  total_uploads: number
  total_downloads: number
}

export interface ReportPage<T> {
  data: ReadonlyArray<T>
  meta: ReportPageMeta
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isRevenue(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Number(value))
}

function isReportPageMeta(value: unknown): value is ReportPageMeta {
  if (!isRecord(value)) return false

  return (
    isNumber(value.current_page) &&
    (value.from === null || isNumber(value.from)) &&
    isNumber(value.last_page) &&
    isNumber(value.per_page) &&
    (value.to === null || isNumber(value.to)) &&
    isNumber(value.total)
  )
}

export function isPartnerDailyReport(value: unknown): value is PartnerDailyReport {
  if (!isRecord(value)) return false

  return (
    isNumber(value.id) &&
    isNumber(value.partner_id) &&
    typeof value.stat_date === "string" &&
    isRevenue(value.total_revenue) &&
    isNumber(value.total_sessions) &&
    isNumber(value.total_customers) &&
    isNumber(value.total_prints) &&
    isNumber(value.total_downloads)
  )
}

export function isPartnerMonthlyReport(value: unknown): value is PartnerMonthlyReport {
  if (!isRecord(value)) return false

  return (
    isNumber(value.id) &&
    isNumber(value.partner_id) &&
    isNumber(value.period_year) &&
    isNumber(value.period_month) &&
    isRevenue(value.total_revenue) &&
    isNumber(value.total_sessions) &&
    isNumber(value.total_customers) &&
    isNumber(value.total_vouchers_used) &&
    isNumber(value.total_qris_transactions) &&
    isNumber(value.total_prints) &&
    isNumber(value.total_downloads) &&
    isNumber(value.total_media) &&
    typeof value.generated_at === "string"
  )
}

export function isAdminDailyReport(value: unknown): value is AdminDailyReport {
  if (!isRecord(value)) return false

  return (
    isNumber(value.id) &&
    typeof value.stat_date === "string" &&
    isNumber(value.total_partners) &&
    isNumber(value.total_booths) &&
    isNumber(value.total_devices) &&
    isNumber(value.total_events) &&
    isNumber(value.total_sessions) &&
    isNumber(value.total_payments) &&
    isNumber(value.total_media) &&
    isNumber(value.total_print_jobs) &&
    isNumber(value.total_uploads) &&
    isNumber(value.total_downloads)
  )
}

export function parseReportPage<T>(
  payload: unknown,
  isItem: (value: unknown) => value is T
): ReportPage<T> | null {
  if (!isRecord(payload) || !isRecord(payload.data)) return null

  const paginator = payload.data
  if (
    !Array.isArray(paginator.data) ||
    !paginator.data.every(isItem) ||
    !isReportPageMeta(paginator)
  ) {
    return null
  }

  return { data: paginator.data, meta: paginator }
}
