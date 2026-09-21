export interface PrinterAlertRecipientRecord {
  id: number
  alert_setting_id: number
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PrinterAlertSettingRecord {
  id: number
  printer_id: number
  total_print_limit: number
  low_stock_threshold: number
  is_active: boolean
  last_notified_at: string | null
  created_at: string
  updated_at: string
  recipients: ReadonlyArray<PrinterAlertRecipientRecord>
}

export interface PrinterAlertSummary {
  is_configured: boolean
  remaining_prints: number | null
  total_print_limit: number | null
  low_stock_threshold: number | null
  is_alert: boolean
  recipients_count: number
  last_notified_at: string | null
}

export interface PrinterAlertSettingResponse {
  printer: { id: number; name: string; booth_id: number | null }
  alert_setting: PrinterAlertSettingRecord | null
  summary: PrinterAlertSummary
}

export interface SaveAlertSettingInput {
  total_print_limit: number
  low_stock_threshold: number
  is_active?: boolean
}

export interface SaveRecipientInput {
  email: string
  is_active?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isAlertSettingPayload(
  value: unknown,
): value is PrinterAlertSettingRecord {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    isNumber(value.printer_id) &&
    isNumber(value.total_print_limit) &&
    isNumber(value.low_stock_threshold) &&
    typeof value.is_active === "boolean"
  )
}

/** Check if response has the full show format: { data: { printer, alert_setting, summary } } */
export function isPrinterAlertShowResponse(
  value: unknown,
): value is { data: PrinterAlertSettingResponse } {
  if (!isRecord(value) || !isRecord(value.data)) return false
  const data = value.data
  return (
    isRecord(data.printer) &&
    isNumber(data.printer.id) &&
    typeof data.printer.name === "string" &&
    isRecord(data.summary) &&
    typeof data.summary.is_configured === "boolean"
  )
}

/** Check if response has the resource format: { data: { id, printer_id, ... } } */
export function isResourceResponse(
  value: unknown,
): value is { data: PrinterAlertSettingRecord } {
  if (!isRecord(value) || !isRecord(value.data)) return false
  return isAlertSettingPayload(value.data)
}
