import { ApiError, apiRequest } from "@/lib/api-client"

import { isPrintJobListResponse, isPrintJobResponse, type PrintJobListFilters, type PrintJobListResponse, type PrintJobRecord } from "./print-job.types"

function parseJob(payload: unknown): PrintJobRecord {
  if (!isPrintJobResponse(payload)) throw new ApiError("Format response Print Job dari server tidak sesuai.", 500)
  return payload.data
}

export async function getPrintJobs(token: string, filters: PrintJobListFilters = {}, signal?: AbortSignal): Promise<PrintJobListResponse> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value !== undefined) params.set(key, String(value))
  const query = params.toString()
  const payload = await apiRequest(query ? `/v1/print-jobs?${query}` : "/v1/print-jobs", { signal }, token)
  if (!isPrintJobListResponse(payload)) throw new ApiError("Format response daftar Print Job dari server tidak sesuai.", 500)
  return payload
}

export async function getPrintJob(token: string, jobId: number): Promise<PrintJobRecord> {
  return parseJob(await apiRequest(`/v1/print-jobs/${jobId}`, {}, token))
}

export async function cancelPrintJob(token: string, jobId: number): Promise<PrintJobRecord> {
  return parseJob(await apiRequest(`/v1/print-jobs/${jobId}/transition`, { method: "POST", body: JSON.stringify({ status: "cancelled" }) }, token))
}

export async function retryPrintJob(token: string, jobId: number): Promise<PrintJobRecord> {
  return parseJob(await apiRequest(`/v1/print-jobs/${jobId}/retry`, { method: "POST" }, token))
}
