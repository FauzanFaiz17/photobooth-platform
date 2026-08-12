import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isDeviceActivationResponse,
  isDeviceListResponse,
  isDeviceResponse,
  type CreateDeviceInput,
  type DeviceActivationResult,
  type DeviceListFilters,
  type DeviceListResponse,
  type DeviceRecord,
  type UpdateDeviceInput,
} from "./device.types"

function listPath(filters: DeviceListFilters): string {
  const params = new URLSearchParams()

  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.status) params.set("status", filters.status)
  if (filters.presence) params.set("presence", filters.presence)
  if (filters.booth_id !== undefined) params.set("booth_id", String(filters.booth_id))
  if (filters.partner_id !== undefined) params.set("partner_id", String(filters.partner_id))
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.direction) params.set("direction", filters.direction)
  if (filters.per_page !== undefined) params.set("per_page", String(filters.per_page))
  if (filters.page !== undefined) params.set("page", String(filters.page))

  const query = params.toString()
  return query ? `/v1/devices?${query}` : "/v1/devices"
}

function parseDevice(payload: unknown): DeviceRecord {
  if (!isDeviceResponse(payload)) throw new ApiError("Format response device dari server tidak sesuai.", 500)
  return payload.data
}

function parseActivation(payload: unknown): DeviceActivationResult {
  if (!isDeviceActivationResponse(payload)) throw new ApiError("Format response aktivasi device dari server tidak sesuai.", 500)
  return payload.data
}

export async function getDevices(token: string, filters: DeviceListFilters = {}, signal?: AbortSignal): Promise<DeviceListResponse> {
  const payload = await apiRequest(listPath(filters), { signal }, token)
  if (!isDeviceListResponse(payload)) throw new ApiError("Format response daftar device dari server tidak sesuai.", 500)
  return payload
}

export async function createDevice(token: string, input: CreateDeviceInput): Promise<DeviceActivationResult> {
  return parseActivation(await apiRequest("/v1/devices", { method: "POST", body: JSON.stringify(input) }, token))
}

export async function updateDevice(token: string, deviceId: number, input: UpdateDeviceInput): Promise<DeviceRecord> {
  return parseDevice(await apiRequest(`/v1/devices/${deviceId}`, { method: "PUT", body: JSON.stringify(input) }, token))
}

export async function regenerateDeviceActivation(token: string, deviceId: number): Promise<DeviceActivationResult> {
  return parseActivation(await apiRequest(`/v1/devices/${deviceId}/regenerate-activation`, { method: "POST" }, token))
}

export async function deleteDevice(token: string, deviceId: number): Promise<void> {
  await apiRequest(`/v1/devices/${deviceId}`, { method: "DELETE" }, token)
}
