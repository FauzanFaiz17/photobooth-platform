import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isPrinterAlertShowResponse,
  isResourceResponse,
} from "./printer-alert.types"
import type {
  PrinterAlertSettingRecord,
  PrinterAlertSettingResponse,
  SaveAlertSettingInput,
  SaveRecipientInput,
} from "./printer-alert.types"

function normalizeResponse(
  payload: unknown,
  printerId: number,
): PrinterAlertSettingResponse {
  if (isPrinterAlertShowResponse(payload)) {
    return payload.data
  }

  if (isResourceResponse(payload)) {
    const setting = payload.data as PrinterAlertSettingRecord
    return {
      printer: { id: printerId, name: "", booth_id: null },
      alert_setting: setting,
      summary: {
        is_configured: true,
        remaining_prints: null,
        total_print_limit: setting.total_print_limit,
        low_stock_threshold: setting.low_stock_threshold,
        is_alert: false,
        recipients_count: Array.isArray(
          (setting as unknown as Record<string, unknown>).recipients,
        )
          ? (
              (setting as unknown as Record<string, unknown>).recipients as ReadonlyArray<unknown>
            ).length
          : 0,
        last_notified_at: setting.last_notified_at,
      },
    }
  }

  throw new ApiError(
    "Format response alert printer dari server tidak sesuai.",
    500,
  )
}

export async function getPrinterAlert(
  token: string,
  printerId: number,
  signal?: AbortSignal,
): Promise<PrinterAlertSettingResponse> {
  const payload = await apiRequest(
    `/v1/printers/${printerId}/alert`,
    { signal },
    token,
  )
  return normalizeResponse(payload, printerId)
}

export async function saveAlertSetting(
  token: string,
  printerId: number,
  input: SaveAlertSettingInput,
): Promise<PrinterAlertSettingResponse> {
  await apiRequest(
    `/v1/printers/${printerId}/alert`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  )
  return getPrinterAlert(token, printerId)
}

export async function deleteAlertSetting(
  token: string,
  printerId: number,
): Promise<void> {
  await apiRequest(
    `/v1/printers/${printerId}/alert`,
    { method: "DELETE" },
    token,
  )
}

export async function addRecipient(
  token: string,
  printerId: number,
  input: SaveRecipientInput,
): Promise<PrinterAlertSettingResponse> {
  await apiRequest(
    `/v1/printers/${printerId}/alert/recipients`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  )
  return getPrinterAlert(token, printerId)
}

export async function removeRecipient(
  token: string,
  printerId: number,
  recipientId: number,
): Promise<PrinterAlertSettingResponse> {
  await apiRequest(
    `/v1/printers/${printerId}/alert/recipients/${recipientId}`,
    { method: "DELETE" },
    token,
  )
  return getPrinterAlert(token, printerId)
}
