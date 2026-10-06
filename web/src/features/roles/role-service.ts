import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isPermissionGroupListResponse,
  isRoleListResponse,
  isRoleResponse,
  type PermissionGroup,
  type RoleRecord,
} from "./role.types"

export async function getRoles(
  token: string,
  signal?: AbortSignal
): Promise<ReadonlyArray<RoleRecord>> {
  const payload = await apiRequest("/v1/roles", { signal }, token)

  if (!isRoleListResponse(payload)) {
    throw new ApiError(
      "Format response daftar role dari server tidak sesuai.",
      500
    )
  }

  return payload.data
}

export async function getRole(
  token: string,
  roleId: number,
  signal?: AbortSignal
): Promise<RoleRecord> {
  const payload = await apiRequest(
    `/v1/roles/${roleId}`,
    { signal },
    token
  )

  if (!isRoleResponse(payload)) {
    throw new ApiError(
      "Format response role dari server tidak sesuai.",
      500
    )
  }

  return payload.data
}

export async function getPermissions(
  token: string,
  signal?: AbortSignal
): Promise<ReadonlyArray<PermissionGroup>> {
  const payload = await apiRequest("/v1/permissions", { signal }, token)

  if (!isPermissionGroupListResponse(payload)) {
    throw new ApiError(
      "Format response permission dari server tidak sesuai.",
      500
    )
  }

  return payload.data
}

export async function syncRolePermissions(
  token: string,
  roleId: number,
  permissionIds: ReadonlyArray<number>
): Promise<RoleRecord> {
  const payload = await apiRequest(
    `/v1/roles/${roleId}/permissions`,
    {
      method: "PUT",
      body: JSON.stringify({ permission_ids: permissionIds }),
    },
    token
  )

  if (!isRoleResponse(payload)) {
    throw new ApiError(
      "Format response role dari server tidak sesuai.",
      500
    )
  }

  return payload.data
}
