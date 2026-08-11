import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isFilterListResponse,
  isFilterResponse,
  type FilterInput,
  type FilterListFilters,
  type FilterListResponse,
  type FilterRecord,
} from "./filter.types"

function createListPath(filters: FilterListFilters): string {
  const params = new URLSearchParams()
  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.scope) params.set("scope", filters.scope)
  if (filters.partner_id !== undefined) params.set("partner_id", String(filters.partner_id))
  if (filters.is_active !== undefined) params.set("is_active", filters.is_active ? "1" : "0")
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.direction) params.set("direction", filters.direction)
  if (filters.per_page !== undefined) params.set("per_page", String(filters.per_page))
  if (filters.page !== undefined) params.set("page", String(filters.page))
  const query = params.toString()
  return query ? `/v1/filters?${query}` : "/v1/filters"
}

function parseFilter(payload: unknown): FilterRecord {
  if (!isFilterResponse(payload)) throw new ApiError("Format response Filter dari server tidak sesuai.", 500)
  return payload.data
}

export async function getFilters(token: string, filters: FilterListFilters = {}, signal?: AbortSignal): Promise<FilterListResponse> {
  const payload = await apiRequest(createListPath(filters), { signal }, token)
  if (!isFilterListResponse(payload)) throw new ApiError("Format response daftar Filter dari server tidak sesuai.", 500)
  return payload
}

export async function createFilter(token: string, input: FilterInput): Promise<FilterRecord> {
  return parseFilter(await apiRequest("/v1/filters", { method: "POST", body: JSON.stringify(input) }, token))
}

export async function updateFilter(token: string, filterId: number, input: FilterInput): Promise<FilterRecord> {
  return parseFilter(await apiRequest(`/v1/filters/${filterId}`, { method: "PUT", body: JSON.stringify(input) }, token))
}

export async function deleteFilter(token: string, filterId: number): Promise<void> {
  await apiRequest(`/v1/filters/${filterId}`, { method: "DELETE" }, token)
}
