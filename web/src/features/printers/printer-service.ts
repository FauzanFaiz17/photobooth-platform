import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isPrinterListResponse,
  isPrinterResponse,
  type CreatePrinterInput,
  type PrinterInput,
  type PrinterListFilters,
  type PrinterListResponse,
  type PrinterRecord,
} from "./printer.types"

function parsePrinter(payload: unknown): PrinterRecord {
  if (!isPrinterResponse(payload)) {
    throw new ApiError("Format response printer dari server tidak sesuai.", 500)
  }
  return payload.data
}

export async function getPrinters(token: string, filters: PrinterListFilters = {}, signal?: AbortSignal): Promise<PrinterListResponse> {
  const params = new URLSearchParams()
  if (filters.partner_id !== undefined) params.set("partner_id", String(filters.partner_id))
  if (filters.booth_id !== undefined) params.set("booth_id", String(filters.booth_id))
  if (filters.is_active !== undefined) params.set("is_active", String(filters.is_active))
  if (filters.per_page !== undefined) params.set("per_page", String(filters.per_page))
  const query = params.toString()
  const payload = await apiRequest(query ? `/v1/printers?${query}` : "/v1/printers", { signal }, token)
  if (!isPrinterListResponse(payload)) {
    throw new ApiError("Format response daftar printer dari server tidak sesuai.", 500)
  }
  return payload
}

export async function createPrinter(token: string, input: CreatePrinterInput): Promise<PrinterRecord> {
  return parsePrinter(await apiRequest("/v1/printers", { method: "POST", body: JSON.stringify(input) }, token))
}

export async function updatePrinter(token: string, printerId: number, input: PrinterInput): Promise<PrinterRecord> {
  return parsePrinter(await apiRequest(`/v1/printers/${printerId}`, { method: "PUT", body: JSON.stringify(input) }, token))
}

export async function deletePrinter(token: string, printerId: number): Promise<void> {
  await apiRequest(`/v1/printers/${printerId}`, { method: "DELETE" }, token)
}
