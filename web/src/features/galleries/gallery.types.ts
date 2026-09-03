import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
} from "@/lib/pagination"

export interface GalleryCustomer {
  id: number
  name: string | null
  email: string | null
  phone: string | null
}

export interface GalleryMedia {
  id: number
  type: string
  filename: string
  mime_type: string
  size_bytes: number
  created_at: string
}

export interface GalleryRecord {
  id: number
  status: string
  partner_id: number | null
  booth_id: number | null
  event_id: number | null
  customer: GalleryCustomer | null
  media: ReadonlyArray<GalleryMedia>
  /** URL absolut ke halaman Public Gallery; null bila token unduhannya belum dibuat. */
  gallery_url: string | null
  expires_at: string | null
  completed_at: string | null
  created_at: string
}

export interface GalleryListFilters {
  partner_id?: number
  per_page?: number
  page?: number
}

export interface GalleryListResponse {
  data: ReadonlyArray<GalleryRecord>
  links: PaginationLinks
  meta: PaginationMeta
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

function isCustomer(value: unknown): value is GalleryCustomer | null {
  if (value === null) return true
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    isNullableString(value.name) &&
    isNullableString(value.email) &&
    isNullableString(value.phone)
  )
}

function isMedia(value: unknown): value is GalleryMedia {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.type === "string" &&
    typeof value.filename === "string" &&
    typeof value.mime_type === "string" &&
    typeof value.size_bytes === "number" &&
    typeof value.created_at === "string"
  )
}

export function isGalleryRecord(value: unknown): value is GalleryRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.status === "string" &&
    isNullableNumber(value.partner_id) &&
    isCustomer(value.customer) &&
    Array.isArray(value.media) &&
    value.media.every(isMedia) &&
    isNullableString(value.gallery_url) &&
    isNullableString(value.expires_at) &&
    isNullableString(value.completed_at) &&
    typeof value.created_at === "string"
  )
}

export function isGalleryListResponse(value: unknown): value is GalleryListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isGalleryRecord) &&
    isPaginationLinks(value.links) &&
    isPaginationMeta(value.meta)
  )
}

