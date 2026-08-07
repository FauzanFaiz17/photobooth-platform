import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isBoothListResponse,
  isBoothResponse,
  type BoothListFilters,
  type BoothListResponse,
  type BoothRecord,
  type CreateBoothInput,
  type UpdateBoothInput,
} from "./booth.types"

function createBoothListPath(filters: BoothListFilters): string {
  const params = new URLSearchParams()

  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.status) params.set("status", filters.status)
  if (filters.partner !== undefined) {
    params.set("partner", String(filters.partner))
  }
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.direction) params.set("direction", filters.direction)
  if (filters.per_page !== undefined) {
    params.set("per_page", String(filters.per_page))
  }
  if (filters.page !== undefined) params.set("page", String(filters.page))

  const query = params.toString()
  return query ? `/v1/booths?${query}` : "/v1/booths"
}

function parseBoothResponse(payload: unknown): BoothRecord {
  if (!isBoothResponse(payload)) {
    throw new ApiError(
      "Format response booth dari server tidak sesuai.",
      500
    )
  }

  return payload.data
}

export async function getBooths(
  token: string,
  filters: BoothListFilters = {},
  signal?: AbortSignal
): Promise<BoothListResponse> {
  const payload = await apiRequest(
    createBoothListPath(filters),
    { signal },
    token
  )

  if (!isBoothListResponse(payload)) {
    throw new ApiError(
      "Format response daftar booth dari server tidak sesuai.",
      500
    )
  }

  return payload
}

export async function getBooth(
  token: string,
  boothId: number,
  signal?: AbortSignal
): Promise<BoothRecord> {
  const payload = await apiRequest(
    `/v1/booths/${boothId}`,
    { signal },
    token
  )

  return parseBoothResponse(payload)
}

export async function createBooth(
  token: string,
  input: CreateBoothInput
): Promise<BoothRecord> {
  const payload = await apiRequest(
    "/v1/booths",
    { method: "POST", body: JSON.stringify(input) },
    token
  )

  return parseBoothResponse(payload)
}

export async function updateBooth(
  token: string,
  boothId: number,
  input: UpdateBoothInput
): Promise<BoothRecord> {
  const payload = await apiRequest(
    `/v1/booths/${boothId}`,
    { method: "PUT", body: JSON.stringify(input) },
    token
  )

  return parseBoothResponse(payload)
}

export async function deleteBooth(
  token: string,
  boothId: number
): Promise<void> {
  await apiRequest(
    `/v1/booths/${boothId}`,
    { method: "DELETE" },
    token
  )
}
