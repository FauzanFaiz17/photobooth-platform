import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isAdminDailyReport,
  isPartnerDailyReport,
  isPartnerMonthlyReport,
  parseReportPage,
  type AdminDailyReport,
  type PartnerDailyReport,
  type PartnerMonthlyReport,
  type ReportPage,
} from "./report.types"

function reportPath(path: string, page: number, partnerId?: number): string {
  const params = new URLSearchParams({ page: String(page), per_page: "25" })
  if (partnerId !== undefined) params.set("partner_id", String(partnerId))
  return `${path}?${params}`
}

async function getReport<T>(
  token: string,
  path: string,
  page: number,
  isItem: (value: unknown) => value is T,
  signal?: AbortSignal,
  partnerId?: number
): Promise<ReportPage<T>> {
  const payload = await apiRequest(reportPath(path, page, partnerId), { signal }, token)
  const result = parseReportPage(payload, isItem)

  if (!result) {
    throw new ApiError("Format response laporan dari server tidak sesuai.", 500)
  }

  return result
}

export function getDailyReports(
  token: string,
  page: number,
  signal?: AbortSignal,
  partnerId?: number
): Promise<ReportPage<PartnerDailyReport>> {
  return getReport(token, "/v1/reports/daily", page, isPartnerDailyReport, signal, partnerId)
}

export function getMonthlyReports(
  token: string,
  page: number,
  signal?: AbortSignal,
  partnerId?: number
): Promise<ReportPage<PartnerMonthlyReport>> {
  return getReport(token, "/v1/reports/monthly", page, isPartnerMonthlyReport, signal, partnerId)
}

export function getAdminDailyReports(
  token: string,
  page: number,
  signal?: AbortSignal
): Promise<ReportPage<AdminDailyReport>> {
  return getReport(token, "/v1/reports/admin/daily", page, isAdminDailyReport, signal)
}
