import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isUserListResponse,
  isUserResponse,
  type CreateUserInput,
  type UpdateUserInput,
  type UserListFilters,
  type UserListResponse,
  type UserRecord,
} from "./user.types"

function createUserListPath(filters: UserListFilters): string {
  const searchParams = new URLSearchParams()
  const search = filters.search?.trim()

  if (search) searchParams.set("search", search)
  if (filters.role !== undefined) {
    searchParams.set("role", String(filters.role))
  }
  if (filters.partner !== undefined) {
    searchParams.set("partner", String(filters.partner))
  }
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
  return query ? `/v1/users?${query}` : "/v1/users"
}

function parseUserResponse(payload: unknown): UserRecord {
  if (!isUserResponse(payload)) {
    throw new ApiError(
      "Format response user dari server tidak sesuai.",
      500
    )
  }

  return payload.data
}

export async function getUsers(
  token: string,
  filters: UserListFilters = {},
  signal?: AbortSignal
): Promise<UserListResponse> {
  const payload = await apiRequest(
    createUserListPath(filters),
    { signal },
    token
  )

  if (!isUserListResponse(payload)) {
    throw new ApiError(
      "Format response daftar user dari server tidak sesuai.",
      500
    )
  }

  return payload
}

export async function getUser(
  token: string,
  userId: number,
  signal?: AbortSignal
): Promise<UserRecord> {
  const payload = await apiRequest(
    `/v1/users/${userId}`,
    { signal },
    token
  )
  return parseUserResponse(payload)
}

export async function createUser(
  token: string,
  input: CreateUserInput
): Promise<UserRecord> {
  const payload = await apiRequest(
    "/v1/users",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token
  )

  return parseUserResponse(payload)
}

export async function updateUser(
  token: string,
  userId: number,
  input: UpdateUserInput
): Promise<UserRecord> {
  const payload = await apiRequest(
    `/v1/users/${userId}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
    token
  )

  return parseUserResponse(payload)
}

export async function deleteUser(
  token: string,
  userId: number
): Promise<void> {
  await apiRequest(
    `/v1/users/${userId}`,
    { method: "DELETE" },
    token
  )
}
