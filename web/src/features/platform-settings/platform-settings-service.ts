import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isConnectionTestResult,
  isMidtransSettings,
  isR2Settings,
  type ConnectionTestResult,
  type MidtransSettings,
  type MidtransSettingsInput,
  type R2Settings,
  type R2SettingsInput,
} from "./platform-settings.types"

function data(payload: unknown): unknown {
  return typeof payload === "object" && payload !== null && "data" in payload
    ? payload.data
    : undefined
}

function parseMidtrans(payload: unknown): MidtransSettings {
  const value = data(payload)
  if (!isMidtransSettings(value)) throw new ApiError("Format response Midtrans tidak sesuai.", 500)
  return value
}

function parseR2(payload: unknown): R2Settings {
  const value = data(payload)
  if (!isR2Settings(value)) throw new ApiError("Format response Cloudflare R2 tidak sesuai.", 500)
  return value
}

function parseTest(payload: unknown): ConnectionTestResult {
  const value = data(payload)
  if (!isConnectionTestResult(value)) throw new ApiError("Format response test koneksi tidak sesuai.", 500)
  return value
}

export async function getMidtransSettings(token: string, signal?: AbortSignal): Promise<MidtransSettings> {
  return parseMidtrans(await apiRequest("/v1/platform-settings/midtrans", { signal }, token))
}

export async function updateMidtransSettings(token: string, input: MidtransSettingsInput): Promise<MidtransSettings> {
  return parseMidtrans(await apiRequest("/v1/platform-settings/midtrans", { method: "PUT", body: JSON.stringify(input) }, token))
}

export async function testMidtransSettings(token: string): Promise<ConnectionTestResult> {
  return parseTest(await apiRequest("/v1/platform-settings/midtrans/test", { method: "POST" }, token))
}

export async function clearMidtransSettings(token: string): Promise<MidtransSettings> {
  return parseMidtrans(await apiRequest("/v1/platform-settings/midtrans", { method: "DELETE" }, token))
}

export async function getR2Settings(token: string, signal?: AbortSignal): Promise<R2Settings> {
  return parseR2(await apiRequest("/v1/platform-settings/r2", { signal }, token))
}

export async function updateR2Settings(token: string, input: R2SettingsInput): Promise<R2Settings> {
  return parseR2(await apiRequest("/v1/platform-settings/r2", { method: "PUT", body: JSON.stringify(input) }, token))
}

export async function testR2Settings(token: string): Promise<ConnectionTestResult> {
  return parseTest(await apiRequest("/v1/platform-settings/r2/test", { method: "POST" }, token))
}

export async function clearR2Settings(token: string): Promise<R2Settings> {
  return parseR2(await apiRequest("/v1/platform-settings/r2", { method: "DELETE" }, token))
}
