import { isPaginationLinks, isPaginationMeta, type PaginationLinks, type PaginationMeta } from "@/lib/pagination"
import { isPrinterRecord, type PrinterRecord } from "@/features/printers/printer.types"

export const PRINT_JOB_STATUSES = ["queued", "printing", "success", "failed", "cancelled"] as const
export type PrintJobStatus = (typeof PRINT_JOB_STATUSES)[number]

export interface PrintJobRecord {
  id: number
  partner_id: number
  photo_session_id: number
  printer_id: number
  printer_snapshot_id: number | null
  copies: number
  status: PrintJobStatus
  duration_ms: number | null
  error_log: string | null
  queued_at: string
  started_at: string | null
  finished_at: string | null
  printer: PrinterRecord | null
  created_at: string
  updated_at: string
}

export interface PrintJobListFilters {
  partner_id?: number
  printer_id?: number
  status?: PrintJobStatus
  per_page?: number
  page?: number
}

export interface PrintJobListResponse {
  data: ReadonlyArray<PrintJobRecord>
  links: PaginationLinks
  meta: PaginationMeta
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

export function isPrintJobStatus(value: unknown): value is PrintJobStatus {
  return PRINT_JOB_STATUSES.some((status) => status === value)
}

export function isPrintJobRecord(value: unknown): value is PrintJobRecord {
  return isRecord(value) && typeof value.id === "number" && typeof value.partner_id === "number" && typeof value.photo_session_id === "number" && typeof value.printer_id === "number" && nullableNumber(value.printer_snapshot_id) && typeof value.copies === "number" && isPrintJobStatus(value.status) && nullableNumber(value.duration_ms) && nullableString(value.error_log) && typeof value.queued_at === "string" && nullableString(value.started_at) && nullableString(value.finished_at) && (value.printer === null || isPrinterRecord(value.printer)) && typeof value.created_at === "string" && typeof value.updated_at === "string"
}

export function isPrintJobListResponse(value: unknown): value is PrintJobListResponse {
  return isRecord(value) && Array.isArray(value.data) && value.data.every(isPrintJobRecord) && isPaginationLinks(value.links) && isPaginationMeta(value.meta)
}

export function isPrintJobResponse(value: unknown): value is { data: PrintJobRecord } {
  return isRecord(value) && isPrintJobRecord(value.data)
}
