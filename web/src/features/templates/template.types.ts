import type { FRAME_SIZES } from "@/constants"
import {
  isPaginationLinks,
  isPaginationMeta,
  type PaginationLinks,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/pagination"
import type { Rect } from "fabric"

export const TEMPLATE_STATUSES = ["draft", "published", "archived"] as const
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number]
export const TEMPLATE_PAPER_SIZES = ["2r", "4r"] as const
export type TemplatePaperSize = (typeof TEMPLATE_PAPER_SIZES)[number]
export const TEMPLATE_TYPES = ["photo", "gif"] as const
export type TemplateType = (typeof TEMPLATE_TYPES)[number]
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
  type: TemplateType
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
  type?: TemplateType
  sort?: "id" | "created_at" | "updated_at" | "version"
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface TemplateInput {
  partner_id?: number | null
  name: string
  type: TemplateType
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

export type FrameSize = keyof typeof FRAME_SIZES;
export type FrameOrientation = "portrait" | "landscape";


/** Rasio awal slot; hanya dipakai saat ukuran diterapkan, resize tetap bebas. */
export const SLOT_RATIOS = {
  "3:2": { value: 3 / 2, label: "Persegi panjang 3:2 (mendatar)" },
  "2:3": { value: 2 / 3, label: "Persegi panjang 2:3 (tegak)" },
  "1:1": { value: 1, label: "Persegi 1:1" },
} as const;

export type SlotRatio = keyof typeof SLOT_RATIOS;

export interface PhotoSlot {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shot: number;
}

/** Rect QR gallery di kanvas template; tanpa field shot. */
export interface QrRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FormErrors {
  partner_id?: string;
  name?: string;
  png?: string;
  slots?: string;
  qr?: string;
}

export type SlotRect = Rect & { slotId: number };

export const QR_SLOT_ID = -1;

export interface FrameCanvasProps {
  canvasWidth: number;
  canvasHeight: number;
  displayWidth: number;
  displayHeight: number;
  overlayUrl: string | null;
  slotsInFront: boolean;
  slots: ReadonlyArray<PhotoSlot>;
  qr: QrRect | null;
  selectedSlotId: number | null;
  onSelect: (slotId: number | null) => void;
  onChange: (slotId: number, updates: Partial<Omit<PhotoSlot, "id">>) => void;
  onQrChange: (updates: Partial<QrRect>) => void;
  onOverlayError: () => void;
}


export interface LayoutSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  shot: number;
}

export interface FrameLayoutInfo {
  width: number;
  height: number;
  paperSize: TemplatePaperSize;
  slotsInFront: boolean;
  slots: ReadonlyArray<LayoutSlot>;
  qr: QrRect | null;
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
    (value.type === undefined || value.type === "photo" || value.type === "gif") &&
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
