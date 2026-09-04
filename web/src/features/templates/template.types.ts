import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/pagination"

export const TEMPLATE_STATUSES = ["draft", "published", "archived"] as const
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number]
export const TEMPLATE_PAPER_SIZES = ["2r", "4r"] as const
export type TemplatePaperSize = (typeof TEMPLATE_PAPER_SIZES)[number]
export type TemplateLayout = ReadonlyArray<unknown> | Readonly<Record<string, unknown>>

export interface TemplatePartner {
  id: number
  company_name: string
}

export interface TemplateRecord {
  id: number
  partner: TemplatePartner | null
  is_global: boolean
  name: string
  paper_size?: TemplatePaperSize | null
  preview_path: string | null
  thumbnail_path: string | null
  json_layout: TemplateLayout
  psd_path: string | null
  png_path: string | null
  png_url?: string | null
  preview_url?: string | null
  thumbnail_url?: string | null
  version: number
  status: TemplateStatus
  created_at: string
  updated_at: string
}

export interface TemplateListFilters {
  search?: string
  scope?: "global" | "partner"
  partner_id?: number
  status?: TemplateStatus
  sort?: "id" | "created_at" | "updated_at" | "version"
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface TemplateInput {
  partner_id?: number | null
  name: string
  paper_size: TemplatePaperSize
  preview_path?: string | null
  thumbnail_path?: string | null
  json_layout: TemplateLayout
  psd_path?: string | null
  png_path?: string | null
  status: TemplateStatus
}

export interface TemplateListResponse {
  data: ReadonlyArray<TemplateRecord>
  links: PaginationLinks
  meta: PaginationMeta
}

interface TemplateResponse {
  data: TemplateRecord
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isTemplateStatus(value: unknown): value is TemplateStatus {
  return TEMPLATE_STATUSES.some((status) => status === value)
}

function isPartner(value: unknown): value is TemplatePartner | null {
  return value === null || (isRecord(value) && typeof value.id === "number" && typeof value.company_name === "string")
}

function isLayout(value: unknown): value is TemplateLayout {
  return Array.isArray(value) || isRecord(value)
}

export function isTemplateRecord(value: unknown): value is TemplateRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    isPartner(value.partner) &&
    typeof value.is_global === "boolean" &&
    typeof value.name === "string" &&
    (value.paper_size === undefined || value.paper_size === null || value.paper_size === "2r" || value.paper_size === "4r") &&
    isNullableString(value.preview_path) &&
    isNullableString(value.thumbnail_path) &&
    isLayout(value.json_layout) &&
    isNullableString(value.psd_path) &&
    isNullableString(value.png_path) &&
    typeof value.version === "number" &&
    isTemplateStatus(value.status) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  )
}

export function isTemplateListResponse(value: unknown): value is TemplateListResponse {
  return isRecord(value) && Array.isArray(value.data) && value.data.every(isTemplateRecord) && isPaginationLinks(value.links) && isPaginationMeta(value.meta)
}

export function isTemplateResponse(value: unknown): value is TemplateResponse {
  return isRecord(value) && isTemplateRecord(value.data)
}
