import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isCameraProfileListResponse,
  isCameraProfileResponse,
  type CameraProfileInput,
  type CameraProfileListFilters,
  type CameraProfileListResponse,
  type CameraProfileRecord,
} from "./camera-profile.types"

function createListPath(filters: CameraProfileListFilters): string {
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
    ? `/v1/camera-profiles?${query}`
    : "/v1/camera-profiles"
}

function parseResponse(payload: unknown): CameraProfileRecord {
  if (!isCameraProfileResponse(payload)) {
    throw new ApiError(
      "Format response camera profile dari server tidak sesuai.",
      500
    )
  }

  return payload.data
}

export async function getCameraProfiles(
  token: string,
  filters: CameraProfileListFilters,
  signal?: AbortSignal
): Promise<CameraProfileListResponse> {
  const payload = await apiRequest(createListPath(filters), { signal }, token)

  if (!isCameraProfileListResponse(payload)) {
    throw new ApiError(
      "Format response daftar camera profile dari server tidak sesuai.",
      500
    )
  }

  return payload
}

export async function createCameraProfile(
  token: string,
  input: CameraProfileInput
): Promise<CameraProfileRecord> {
  const payload = await apiRequest(
    "/v1/camera-profiles",
    { method: "POST", body: JSON.stringify(input) },
    token
  )

  return parseResponse(payload)
}

export async function updateCameraProfile(
  token: string,
  profileId: number,
  input: CameraProfileInput
): Promise<CameraProfileRecord> {
  const payload = await apiRequest(
    `/v1/camera-profiles/${profileId}`,
    { method: "PUT", body: JSON.stringify(input) },
    token
  )

  return parseResponse(payload)
}

export async function deleteCameraProfile(
  token: string,
  profileId: number
): Promise<void> {
  await apiRequest(
    `/v1/camera-profiles/${profileId}`,
    { method: "DELETE" },
    token
  )
}
