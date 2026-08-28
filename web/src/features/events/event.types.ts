import {
  isPaginationLinks,
  type PaginationLinks,
  type SortDirection,
} from "@/lib/pagination"

export const EVENT_STATUSES = [
  "draft",
  "scheduled",
  "ongoing",
  "completed",
  "cancelled",
] as const

export type EventStatus = (typeof EVENT_STATUSES)[number]
export type EventSortField = "event_date" | "event_name" | "created_at" | "status"

export interface EventPartner {
  id: number
  company_name: string
  brand_name?: string | null
}

export interface EventBooth {
  id: number
  name: string
  location?: string | null
  status?: "active" | "maintenance" | "inactive"
}

export interface EventCreator {
  id: number
  name: string
  email?: string | null
}

export interface EventTemplateSnapshot {
  id: number
  template_id: number
  name: string
  version: number
}

export interface EventFilterSnapshot {
  id: number
  filter_id: number
  name: string
  intensity: number
  version: number
}

export interface EventCameraSnapshot {
  id: number
  camera_profile_id: number
  iso: string | null
  shutter_speed: string | null
  aperture: string | null
  countdown_seconds: number
  burst_count: number
  version: number
}

export interface EventPrinterSnapshot {
  id: number
  printer_profile_id: number
  printer_name: string
  copies: number
  paper_size: string
  orientation: "portrait" | "landscape"
  version: number
}

export interface EventConfiguration {
  template: EventTemplateSnapshot
  templates?: ReadonlyArray<EventTemplateSnapshot>
  filter: EventFilterSnapshot
  filters?: ReadonlyArray<EventFilterSnapshot>
  print_options?: ReadonlyArray<EventPrintOptionRecord>
  camera: EventCameraSnapshot
  printer: EventPrinterSnapshot
}

export interface EventPrintOptionRecord {
  id: number
  paper_size: "2r" | "4r"
  unit_quantity: number
  quantity_step: number
  price: string | number
  is_active: boolean
}

export interface EventRecord {
  id: number
  event_name: string
  event_code: string
  event_date: string
  start_time: string
  end_time: string
  price: string | number
  print_count_limit: number
  status: EventStatus
  partner: EventPartner
  booth: EventBooth
  created_by: EventCreator
  configuration: EventConfiguration
  created_at: string
  updated_at: string
}

export interface EventListFilters {
  search?: string
  status?: EventStatus
  booth_id?: number
  partner_id?: number
  date_from?: string
  date_to?: string
  sort?: EventSortField
  direction?: SortDirection
  per_page?: number
  page?: number
}

export interface CreateEventInput {
  booth_id: number
  event_name: string
  template_id: number
  template_ids: ReadonlyArray<number>
  filter_id: number
  filter_ids: ReadonlyArray<number>
  print_options: ReadonlyArray<EventPrintOptionInput>
  camera_profile_id: number
  printer_profile_id: number
  event_date: string
  start_time: string
  end_time: string
  price?: number | null
  print_count_limit?: number | null
  status?: "draft" | "scheduled"
}

export interface EventPrintOptionInput {
  paper_size: "2r" | "4r"
  unit_quantity: number
  quantity_step: number
  price: number
}

export interface UpdateEventInput {
  event_name: string
  event_date: string
  start_time: string
  end_time: string
  price?: number | null
  print_count_limit?: number | null
  status: EventStatus
}

export interface EventListResponse {
  data: ReadonlyArray<EventRecord>
  links?: PaginationLinks
  meta: EventPaginationMeta
}

export interface EventPaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from?: number | null
  to?: number | null
  links?: ReadonlyArray<unknown>
  path?: string
}

export interface EventConfigurationOption {
  id: number
  name: string
  is_global: boolean
}

export interface EventConfigurationOptions {
  templates: ReadonlyArray<EventConfigurationOption>
  filters: ReadonlyArray<EventConfigurationOption>
  cameras: ReadonlyArray<EventConfigurationOption>
  printers: ReadonlyArray<EventConfigurationOption>
}

interface EventResponse {
  data: EventRecord
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isNumeric(value: unknown): value is string | number {
  return isNumber(value) || (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
}

export function isEventStatus(value: unknown): value is EventStatus {
  return EVENT_STATUSES.some((status) => status === value)
}

function isPartner(value: unknown): value is EventPartner {
  return isRecord(value) && isNumber(value.id) && typeof value.company_name === "string" && (value.brand_name === undefined || isNullableString(value.brand_name))
}

function isBooth(value: unknown): value is EventBooth {
  return isRecord(value) && isNumber(value.id) && typeof value.name === "string" && (value.location === undefined || isNullableString(value.location)) && (value.status === undefined || value.status === "active" || value.status === "maintenance" || value.status === "inactive")
}

function isCreator(value: unknown): value is EventCreator {
  return isRecord(value) && isNumber(value.id) && typeof value.name === "string" && (value.email === undefined || isNullableString(value.email))
}

function isTemplateSnapshot(value: unknown): value is EventTemplateSnapshot {
  return isRecord(value) && isNumber(value.id) && isNumber(value.template_id) && typeof value.name === "string" && isNumber(value.version)
}

function isFilterSnapshot(value: unknown): value is EventFilterSnapshot {
  return isRecord(value) && isNumber(value.id) && isNumber(value.filter_id) && typeof value.name === "string" && isNumber(value.intensity) && isNumber(value.version)
}

function isCameraSnapshot(value: unknown): value is EventCameraSnapshot {
  return isRecord(value) && isNumber(value.id) && isNumber(value.camera_profile_id) && isNullableString(value.iso) && isNullableString(value.shutter_speed) && isNullableString(value.aperture) && isNumber(value.countdown_seconds) && isNumber(value.burst_count) && isNumber(value.version)
}

function isPrinterSnapshot(value: unknown): value is EventPrinterSnapshot {
  return isRecord(value) && isNumber(value.id) && isNumber(value.printer_profile_id) && typeof value.printer_name === "string" && isNumber(value.copies) && typeof value.paper_size === "string" && (value.orientation === "portrait" || value.orientation === "landscape") && isNumber(value.version)
}

function isPrintOption(value: unknown): value is EventPrintOptionRecord {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    (value.paper_size === "2r" || value.paper_size === "4r") &&
    isNumber(value.unit_quantity) &&
    isNumber(value.quantity_step) &&
    isNumeric(value.price) &&
    typeof value.is_active === "boolean"
  )
}

export function isEventRecord(value: unknown): value is EventRecord {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    typeof value.event_name === "string" &&
    typeof value.event_code === "string" &&
    typeof value.event_date === "string" &&
    typeof value.start_time === "string" &&
    typeof value.end_time === "string" &&
    isNumeric(value.price) &&
    isNumber(value.print_count_limit) &&
    isEventStatus(value.status) &&
    isPartner(value.partner) &&
    isBooth(value.booth) &&
    isCreator(value.created_by) &&
    isConfiguration(value.configuration) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  )
}

function isConfiguration(value: unknown): value is EventConfiguration {
  return (
    isRecord(value) &&
    isTemplateSnapshot(value.template) &&
    (value.templates === undefined || (Array.isArray(value.templates) && value.templates.every(isTemplateSnapshot))) &&
    isFilterSnapshot(value.filter) &&
    (value.filters === undefined || (Array.isArray(value.filters) && value.filters.every(isFilterSnapshot))) &&
    (value.print_options === undefined || (Array.isArray(value.print_options) && value.print_options.every(isPrintOption))) &&
    isCameraSnapshot(value.camera) &&
    isPrinterSnapshot(value.printer)
  )
}

export function isEventListResponse(value: unknown): value is EventListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isEventRecord) &&
    isEventPaginationMeta(value.meta) &&
    (value.links === undefined || isPaginationLinks(value.links))
  )
}

function isEventPaginationMeta(value: unknown): value is EventPaginationMeta {
  return (
    isRecord(value) &&
    isNumber(value.current_page) &&
    isNumber(value.last_page) &&
    isNumber(value.per_page) &&
    isNumber(value.total) &&
    (value.from === undefined || value.from === null || isNumber(value.from)) &&
    (value.to === undefined || value.to === null || isNumber(value.to))
  )
}

export function isEventResponse(value: unknown): value is EventResponse {
  return isRecord(value) && isEventRecord(value.data)
}
