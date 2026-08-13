export interface MidtransSettings {
  gateway: "midtrans"
  environment: "sandbox" | "production"
  merchant_id: string | null
  client_key_masked: string | null
  client_key_configured: boolean
  server_key_masked: string | null
  server_key_configured: boolean
  qris_enabled: boolean
  notification_url: string
  source: "database" | "environment"
  updated_at: string | null
}

export interface MidtransSettingsInput {
  merchant_id: string
  client_key?: string
  server_key?: string
  production: boolean
  qris_enabled: boolean
  timeout: number
}

export interface R2Settings {
  provider: "cloudflare_r2"
  enabled: boolean
  bucket: string | null
  endpoint: string | null
  region: string
  use_path_style_endpoint: boolean
  access_key_id_masked: string | null
  access_key_id_configured: boolean
  secret_access_key_configured: boolean
  source: "database" | "environment"
  updated_at: string | null
}

export interface R2SettingsInput {
  access_key_id?: string
  secret_access_key?: string
  bucket: string
  endpoint: string
  region: string
  use_path_style_endpoint: boolean
  enabled: boolean
}

export interface ConnectionTestResult {
  connected: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isSource(value: unknown): value is "database" | "environment" {
  return value === "database" || value === "environment"
}

export function isMidtransSettings(value: unknown): value is MidtransSettings {
  return isRecord(value) && value.gateway === "midtrans" && (value.environment === "sandbox" || value.environment === "production") && isNullableString(value.merchant_id) && isNullableString(value.client_key_masked) && typeof value.client_key_configured === "boolean" && isNullableString(value.server_key_masked) && typeof value.server_key_configured === "boolean" && typeof value.qris_enabled === "boolean" && typeof value.notification_url === "string" && isSource(value.source) && isNullableString(value.updated_at)
}

export function isR2Settings(value: unknown): value is R2Settings {
  return isRecord(value) && value.provider === "cloudflare_r2" && typeof value.enabled === "boolean" && isNullableString(value.bucket) && isNullableString(value.endpoint) && typeof value.region === "string" && typeof value.use_path_style_endpoint === "boolean" && isNullableString(value.access_key_id_masked) && typeof value.access_key_id_configured === "boolean" && typeof value.secret_access_key_configured === "boolean" && isSource(value.source) && isNullableString(value.updated_at)
}

export function isConnectionTestResult(value: unknown): value is ConnectionTestResult {
  return isRecord(value) && value.connected === true
}
