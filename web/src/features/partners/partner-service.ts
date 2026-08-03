import { ApiError, apiRequest, resolveStorageUrl } from "@/lib/api-client"

import {
  isPartnerListResponse,
  isPartnerResponse,
  type CreatePartnerInput,
  type PartnerListFilters,
  type PartnerListResponse,
  type PartnerRecord,
  type UpdatePartnerInput,
} from "./partner.types"

function createPartnerListPath(filters: PartnerListFilters): string {
  const searchParams = new URLSearchParams()
  const search = filters.search?.trim()

  if (search) searchParams.set("search", search)
  if (filters.status) searchParams.set("status", filters.status)
  if (filters.sort) searchParams.set("sort", filters.sort)
  if (filters.direction) {
    searchParams.set("direction", filters.direction)
  }
  if (filters.per_page !== undefined) {
    searchParams.set("per_page", String(filters.per_page))
  }
  if (filters.page !== undefined) {
    searchParams.set("page", String(filters.page))
  }

  const query = searchParams.toString()
  return query ? `/v1/partners?${query}` : "/v1/partners"
}

function parsePartnerResponse(payload: unknown): PartnerRecord {
  if (!isPartnerResponse(payload)) {
    throw new ApiError(
      "Format response partner dari server tidak sesuai.",
      500
    )
  }

  return payload.data
}

export async function getPartners(
  token: string,
  filters: PartnerListFilters = {},
  signal?: AbortSignal
): Promise<PartnerListResponse> {
  const payload = await apiRequest(
    createPartnerListPath(filters),
    { signal },
    token
  )

  if (!isPartnerListResponse(payload)) {
    throw new ApiError(
      "Format response daftar partner dari server tidak sesuai.",
      500
    )
  }

  return payload
}

export async function getPartner(
  token: string,
  partnerId: number,
  signal?: AbortSignal
): Promise<PartnerRecord> {
  const payload = await apiRequest(
    `/v1/partners/${partnerId}`,
    { signal },
    token
  )

  return parsePartnerResponse(payload)
}

export async function createPartner(
  token: string,
  input: CreatePartnerInput
): Promise<PartnerRecord> {
  const payload = await apiRequest(
    "/v1/partners",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token
  )

  return parsePartnerResponse(payload)
}

export async function updatePartner(
  token: string,
  partnerId: number,
  input: UpdatePartnerInput
): Promise<PartnerRecord> {
  const payload = await apiRequest(
    `/v1/partners/${partnerId}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
    token
  )

  return parsePartnerResponse(payload)
}

/**
 * Backend menolak dengan 422 "Partner still has users." ketika partner
 * masih memiliki user terkait.
 */
export async function deletePartner(
  token: string,
  partnerId: number
): Promise<void> {
  await apiRequest(
    `/v1/partners/${partnerId}`,
    { method: "DELETE" },
    token
  )
}

export function resolvePartnerLogoUrl(logo: string | null): string | null {
  return resolveStorageUrl(logo)
}
