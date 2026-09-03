export type ValidationErrors = Record<string, ReadonlyArray<string>>

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = (configuredApiBaseUrl || "/api").replace(
  /\/+$/,
  ""
)

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
  if (response.status === 204) return null

  const contentType = response.headers.get("content-type")
  if (!contentType?.includes("application/json")) return null

  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

function createApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
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

export async function apiRequest(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<unknown> {
  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")

  // FormData harus menetapkan boundary-nya sendiri; memaksa JSON merusak multipart upload.
  if (options.body && !headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(createApiUrl(path), {
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

export function resolveStorageUrl(storagePath: string | null): string | null {
  if (!storagePath) return null

  if (/^https?:\/\//i.test(storagePath)) {
    return storagePath
  }

  const normalizedPath = storagePath
    .replace(/^\/+/, "")
    .replace(/^storage\//, "")

  if (/^https?:\/\//i.test(API_BASE_URL)) {
    const backendOrigin = new URL(API_BASE_URL).origin
    return `${backendOrigin}/storage/${normalizedPath}`
  }

  return `/storage/${normalizedPath}`
}
