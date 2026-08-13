import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
} from "@/lib/pagination"

export interface PrinterRecord {
  id: number
  partner_id: number
  booth_id: number | null
  device_id: number | null
  name: string
  driver_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PrinterListResponse {
  data: ReadonlyArray<PrinterRecord>
  links: PaginationLinks
  meta: PaginationMeta
}

export interface PrinterListFilters {
  partner_id?: number
  booth_id?: number
  is_active?: boolean
  per_page?: number
}

export interface PrinterInput {
  booth_id: number | null
  device_id: number | null
  name: string
  driver_name: string | null
  is_active: boolean
}

export interface CreatePrinterInput extends PrinterInput {
  partner_id: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number"
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

export function isPrinterRecord(value: unknown): value is PrinterRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.partner_id === "number" &&
    isNullableNumber(value.booth_id) &&
    isNullableNumber(value.device_id) &&
    typeof value.name === "string" &&
    isNullableString(value.driver_name) &&
    typeof value.is_active === "boolean" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  )
}

export function isPrinterListResponse(value: unknown): value is PrinterListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isPrinterRecord) &&
    isPaginationLinks(value.links) &&
    isPaginationMeta(value.meta)
  )
}

export function isPrinterResponse(value: unknown): value is { data: PrinterRecord } {
  return isRecord(value) && isPrinterRecord(value.data)
}
