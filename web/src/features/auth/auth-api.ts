import {
  isAuthUser,
  type AuthUser,
  type LoginCredentials,
  type LoginResponse,
} from "./auth.types"
import {
  ApiError,
  apiRequest,
  resolveStorageUrl,
} from "@/lib/api-client"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseLoginResponse(payload: unknown): LoginResponse {
  if (
    !isRecord(payload) ||
    payload.success !== true ||
    typeof payload.message !== "string" ||
    !isRecord(payload.data) ||
    typeof payload.data.token !== "string" ||
    !isAuthUser(payload.data.user)
  ) {
    throw new ApiError(
      "Format response login dari server tidak sesuai.",
      500
    )
  }

  return {
    success: true,
    message: payload.message,
    token: payload.data.token,
    user: payload.data.user,
  }
}

export async function loginRequest(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const payload = await apiRequest("/v1/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })

  return parseLoginResponse(payload)
}

export async function profileRequest(token: string): Promise<AuthUser> {
  const payload = await apiRequest("/v1/profile", {}, token)

  if (
    !isRecord(payload) ||
    !("data" in payload) ||
    !isAuthUser(payload.data)
  ) {
    throw new ApiError(
      "Format response profil dari server tidak sesuai.",
      500
    )
  }

  return payload.data
}

export async function logoutRequest(token: string): Promise<void> {
  await apiRequest("/v1/logout", { method: "POST" }, token)
}

export function resolveAvatarUrl(avatarPath: string | null): string | null {
  return resolveStorageUrl(avatarPath)
}
