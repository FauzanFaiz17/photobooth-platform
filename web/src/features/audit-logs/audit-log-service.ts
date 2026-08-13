import { ApiError, apiRequest } from "@/lib/api-client"

import { parseAuditLogPage, type AuditLogPage } from "./audit-log.types"

export async function getAuditLogs(token: string, filters: { readonly partner_id?: number; readonly action?: string; readonly page?: number }, signal?: AbortSignal): Promise<AuditLogPage> {
  const params = new URLSearchParams({ per_page: "25" })
  if (filters.partner_id !== undefined) params.set("partner_id", String(filters.partner_id))
  if (filters.action) params.set("action", filters.action)
  if (filters.page !== undefined) params.set("page", String(filters.page))
  const payload = await apiRequest(`/v1/audit-logs?${params}`, { signal }, token)
  const result = parseAuditLogPage(payload)
  if (!result) throw new ApiError("Format response Audit Log dari server tidak sesuai.", 500)
  return result
}
