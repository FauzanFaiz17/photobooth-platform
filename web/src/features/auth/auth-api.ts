import {
  isAuthUser,
  type AuthUser,
  type LoginCredentials,
  type LoginResponse,
} from "./auth.types"

type ValidationErrors = Record<string, ReadonlyArray<string>>

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = (configuredApiBaseUrl || "/api").replace(/\/+$/, "")

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readMessage(payload: unknown, fallback: string): string {
  return isRecord(payload) && typeof payload.message === "string"
    ? payload.message
    : fallback
}

function readValidationErrors(payload: unknown): ValidationErrors {
  if (!isRecord(payload) || !isRecord(payload.errors)) return {}

  const validationErrors: ValidationErrors = {}

  for (const [field, messages] of Object.entries(payload.errors)) {
    if (!Array.isArray(messages)) continue

    const stringMessages = messages.filter(
      (message): message is string => typeof message === "string"
    )

    if (stringMessages.length > 0) {
      validationErrors[field] = stringMessages
    }
  }

  return validationErrors
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type")
  if (!contentType?.includes("application/json")) return null

  return response.json() as Promise<unknown>
}

export class ApiError extends Error {
  readonly status: number
  readonly validationErrors: ValidationErrors

  constructor(
    message: string,
    status: number,
    validationErrors: ValidationErrors = {}
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.validationErrors = validationErrors
  }
}

async function request(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<unknown> {
  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")

  if (options.body) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
  const payload = await readJson(response)

  if (!response.ok) {
    throw new ApiError(
      readMessage(payload, "Permintaan tidak dapat diproses."),
      response.status,
      readValidationErrors(payload)
    )
  }

  return payload
}

function parseLoginResponse(payload: unknown): LoginResponse {
  if (
    !isRecord(payload) ||
    payload.success !== true ||
    typeof payload.message !== "string" ||
    typeof payload.token !== "string" ||
    !isAuthUser(payload.user)
  ) {
    throw new ApiError(
      "Format response login dari server tidak sesuai.",
      500
    )
  }

  return {
    success: true,
    message: payload.message,
    token: payload.token,
    user: payload.user,
  }
}

export async function loginRequest(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const payload = await request("/v1/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })

  return parseLoginResponse(payload)
}

export async function profileRequest(token: string): Promise<AuthUser> {
  const payload = await request("/v1/profile", {}, token)

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
  await request("/v1/logout", { method: "POST" }, token)
}

export function resolveAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null

  if (/^https?:\/\//i.test(avatarPath)) {
    return avatarPath
  }

  const normalizedPath = avatarPath
    .replace(/^\/+/, "")
    .replace(/^storage\//, "")

  if (/^https?:\/\//i.test(API_BASE_URL)) {
    const backendOrigin = new URL(API_BASE_URL).origin
    return `${backendOrigin}/storage/${normalizedPath}`
  }

  return `/storage/${normalizedPath}`
}
