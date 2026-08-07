import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/pagination"

export type PrinterOrientation = "portrait" | "landscape"

export interface PrinterProfilePartner {
  id: number
  company_name: string
}

export interface PrinterProfileRecord {
  id: number
  partner: PrinterProfilePartner | null
  is_global: boolean
  printer_name: string
  copies: number
  paper_size: string
  orientation: PrinterOrientation
  auto_print: boolean
  border: boolean
  bleed: number
  delay_ms: number
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PrinterProfileListFilters {
  search?: string
  scope?: "global" | "partner"
  partner_id?: number
  is_active?: boolean
  sort?: "id" | "created_at" | "updated_at" | "version"
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface PrinterProfileInput {
  partner_id?: number | null
  printer_name: string
  copies: number
  paper_size: string
  orientation: PrinterOrientation
  auto_print: boolean
  border: boolean
  bleed: number
  delay_ms: number
  is_active: boolean
}

export interface PrinterProfileListResponse {
  data: ReadonlyArray<PrinterProfileRecord>
  links: PaginationLinks
  meta: PaginationMeta
}

interface PrinterProfileResponse {
  data: PrinterProfileRecord
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isPartner(value: unknown): value is PrinterProfilePartner | null {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.id === "number" &&
      typeof value.company_name === "string")
  )
}

export function isPrinterProfileRecord(
  value: unknown
): value is PrinterProfileRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    isPartner(value.partner) &&
    typeof value.is_global === "boolean" &&
    typeof value.printer_name === "string" &&
    typeof value.copies === "number" &&
    typeof value.paper_size === "string" &&
    (value.orientation === "portrait" || value.orientation === "landscape") &&
    typeof value.auto_print === "boolean" &&
    typeof value.border === "boolean" &&
    typeof value.bleed === "number" &&
    typeof value.delay_ms === "number" &&
    typeof value.version === "number" &&
    typeof value.is_active === "boolean" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  )
}

export function isPrinterProfileListResponse(
  value: unknown
): value is PrinterProfileListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isPrinterProfileRecord) &&
    isPaginationLinks(value.links) &&
    isPaginationMeta(value.meta)
  )
}

export function isPrinterProfileResponse(
  value: unknown
): value is PrinterProfileResponse {
  return isRecord(value) && isPrinterProfileRecord(value.data)
}
