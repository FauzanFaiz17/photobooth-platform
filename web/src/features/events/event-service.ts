import { getCameraProfiles } from "@/features/camera-profiles/camera-profile-service"
import { getPrinterProfiles } from "@/features/printer-profiles/printer-profile-service"
import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isEventListResponse,
  isEventResponse,
  type CreateEventInput,
  type EventConfigurationOption,
  type EventConfigurationOptions,
  type EventListFilters,
  type EventListResponse,
  type EventRecord,
  type UpdateEventInput,
} from "./event.types"

function createListPath(filters: EventListFilters): string {
  const params = new URLSearchParams()

  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.status) params.set("status", filters.status)
  if (filters.booth_id !== undefined) params.set("booth_id", String(filters.booth_id))
  if (filters.partner_id !== undefined) params.set("partner_id", String(filters.partner_id))
  if (filters.date_from) params.set("date_from", filters.date_from)
  if (filters.date_to) params.set("date_to", filters.date_to)
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.direction) params.set("direction", filters.direction)
  if (filters.per_page !== undefined) params.set("per_page", String(filters.per_page))
  if (filters.page !== undefined) params.set("page", String(filters.page))

  const query = params.toString()
  return query ? `/v1/events?${query}` : "/v1/events"
}

function parseEvent(payload: unknown): EventRecord {
  if (!isEventResponse(payload)) {
    throw new ApiError("Format response event dari server tidak sesuai.", 500)
  }
  return normalizeEvent(payload.data)
}

function normalizeEvent(event: EventRecord): EventRecord {
  return { ...event, event_date: event.event_date.slice(0, 10) }
}

function parseConfigurationOptions(payload: unknown, nameField: "name" | "printer_name"): ReadonlyArray<EventConfigurationOption> {
  if (typeof payload !== "object" || payload === null || !("data" in payload) || !Array.isArray(payload.data)) {
    throw new ApiError("Format response konfigurasi Event dari server tidak sesuai.", 500)
  }

  return payload.data.map((item: unknown) => {
    if (typeof item !== "object" || item === null) {
      throw new ApiError("Format konfigurasi Event dari server tidak sesuai.", 500)
    }
    const record = item as Record<string, unknown>
    if (typeof record.id !== "number" || typeof record[nameField] !== "string" || typeof record.is_global !== "boolean") {
      throw new ApiError("Format konfigurasi Event dari server tidak sesuai.", 500)
    }
    return { id: record.id, name: record[nameField], is_global: record.is_global }
  })
}

async function getNamedConfigurations(
  token: string,
  path: "templates" | "filters",
  partnerId: number,
  signal?: AbortSignal
): Promise<ReadonlyArray<EventConfigurationOption>> {
  const domainFilter = path === "templates" ? "status=published" : "is_active=1"
  const [partnerPayload, globalPayload] = await Promise.all([
    apiRequest(`/v1/${path}?scope=partner&partner_id=${partnerId}&${domainFilter}&per_page=100`, { signal }, token),
    apiRequest(`/v1/${path}?scope=global&${domainFilter}&per_page=100`, { signal }, token),
  ])

  return [...parseConfigurationOptions(partnerPayload, "name"), ...parseConfigurationOptions(globalPayload, "name")]
}

export async function getEvents(token: string, filters: EventListFilters = {}, signal?: AbortSignal): Promise<EventListResponse> {
  const payload = await apiRequest(createListPath(filters), { signal }, token)
  if (!isEventListResponse(payload)) {
    throw new ApiError("Format response daftar event dari server tidak sesuai.", 500)
  }
  return { ...payload, data: payload.data.map(normalizeEvent) }
}

export async function getEvent(token: string, eventId: number, signal?: AbortSignal): Promise<EventRecord> {
  return parseEvent(await apiRequest(`/v1/events/${eventId}`, { signal }, token))
}

export async function createEvent(token: string, input: CreateEventInput): Promise<EventRecord> {
  return parseEvent(await apiRequest("/v1/events", { method: "POST", body: JSON.stringify(input) }, token))
}

export async function updateEvent(token: string, eventId: number, input: UpdateEventInput): Promise<EventRecord> {
  return parseEvent(await apiRequest(`/v1/events/${eventId}`, { method: "PUT", body: JSON.stringify(input) }, token))
}

export async function deleteEvent(token: string, eventId: number): Promise<void> {
  await apiRequest(`/v1/events/${eventId}`, { method: "DELETE" }, token)
}

export async function getEventConfigurationOptions(token: string, partnerId: number, signal?: AbortSignal): Promise<EventConfigurationOptions> {
  const [templates, filters, partnerCameras, globalCameras, partnerPrinters, globalPrinters] = await Promise.all([
    getNamedConfigurations(token, "templates", partnerId, signal),
    getNamedConfigurations(token, "filters", partnerId, signal),
    getCameraProfiles(token, { scope: "partner", partner_id: partnerId, is_active: true, per_page: 100 }, signal),
    getCameraProfiles(token, { scope: "global", is_active: true, per_page: 100 }, signal),
    getPrinterProfiles(token, { scope: "partner", partner_id: partnerId, is_active: true, per_page: 100 }, signal),
    getPrinterProfiles(token, { scope: "global", is_active: true, per_page: 100 }, signal),
  ])

  return {
    templates,
    filters,
    cameras: [...partnerCameras.data, ...globalCameras.data].map((profile) => ({ id: profile.id, name: profile.name, is_global: profile.is_global })),
    printers: parseConfigurationOptions({ data: [...partnerPrinters.data, ...globalPrinters.data] }, "printer_name"),
  }
}
