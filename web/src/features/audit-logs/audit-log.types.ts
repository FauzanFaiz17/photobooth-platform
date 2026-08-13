export const AUDIT_ACTIONS = ["login", "logout", "payment", "voucher", "upload", "download", "print", "update", "delete"] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export interface AuditLogRecord {
  id: number
  partner_id: number | null
  user_id: number | null
  action: string
  subject_type: string | null
  subject_id: number | null
  description: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AuditLogPage {
  data: ReadonlyArray<AuditLogRecord>
  meta: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function nullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number"
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isAuditLog(value: unknown): value is AuditLogRecord {
  return isRecord(value) && typeof value.id === "number" && nullableNumber(value.partner_id) && nullableNumber(value.user_id) && typeof value.action === "string" && nullableString(value.subject_type) && nullableNumber(value.subject_id) && nullableString(value.description) && nullableString(value.ip_address) && nullableString(value.user_agent) && (value.metadata === null || isRecord(value.metadata)) && typeof value.created_at === "string"
}

export function parseAuditLogPage(payload: unknown): AuditLogPage | null {
  if (!isRecord(payload) || !isRecord(payload.data)) return null
  const page = payload.data
  if (!Array.isArray(page.data) || !page.data.every(isAuditLog) || typeof page.current_page !== "number" || !nullableNumber(page.from) || typeof page.last_page !== "number" || typeof page.per_page !== "number" || !nullableNumber(page.to) || typeof page.total !== "number") return null
  return { data: page.data, meta: { current_page: page.current_page, from: page.from, last_page: page.last_page, per_page: page.per_page, to: page.to, total: page.total } }
}
