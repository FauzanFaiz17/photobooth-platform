import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isPrinterProfileListResponse,
  isPrinterProfileResponse,
  type PrinterProfileInput,
  type PrinterProfileListFilters,
  type PrinterProfileListResponse,
  type PrinterProfileRecord,
} from "./printer-profile.types"

function createListPath(filters: PrinterProfileListFilters): string {
  const params = new URLSearchParams()

  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.scope) params.set("scope", filters.scope)
  if (filters.partner_id !== undefined) {
    params.set("partner_id", String(filters.partner_id))
  }
  if (filters.is_active !== undefined) {
    params.set("is_active", filters.is_active ? "1" : "0")
  }
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.direction) params.set("direction", filters.direction)
  if (filters.per_page !== undefined) {
    params.set("per_page", String(filters.per_page))
  }
  if (filters.page !== undefined) params.set("page", String(filters.page))

  const query = params.toString()
  return query
    ? `/v1/printer-profiles?${query}`
    : "/v1/printer-profiles"
}

function parseResponse(payload: unknown): PrinterProfileRecord {
  if (!isPrinterProfileResponse(payload)) {
    throw new ApiError(
      "Format response printer profile dari server tidak sesuai.",
      500
    )
  }

  return payload.data
}

export async function getPrinterProfiles(
  token: string,
  filters: PrinterProfileListFilters,
  signal?: AbortSignal
): Promise<PrinterProfileListResponse> {
  const payload = await apiRequest(createListPath(filters), { signal }, token)

  if (!isPrinterProfileListResponse(payload)) {
    throw new ApiError(
      "Format response daftar printer profile dari server tidak sesuai.",
      500
    )
  }

  return payload
}

export async function createPrinterProfile(
  token: string,
  input: PrinterProfileInput
): Promise<PrinterProfileRecord> {
  const payload = await apiRequest(
    "/v1/printer-profiles",
    { method: "POST", body: JSON.stringify(input) },
    token
  )

  return parseResponse(payload)
}

export async function updatePrinterProfile(
  token: string,
  profileId: number,
  input: PrinterProfileInput
): Promise<PrinterProfileRecord> {
  const payload = await apiRequest(
    `/v1/printer-profiles/${profileId}`,
    { method: "PUT", body: JSON.stringify(input) },
    token
  )

  return parseResponse(payload)
}

export async function deletePrinterProfile(
  token: string,
  profileId: number
): Promise<void> {
  await apiRequest(
    `/v1/printer-profiles/${profileId}`,
    { method: "DELETE" },
    token
  )
}
