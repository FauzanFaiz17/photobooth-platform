import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isTemplateListResponse,
  isTemplateResponse,
  type TemplateInput,
  type TemplateListFilters,
  type TemplateListResponse,
  type TemplateRecord,
} from "./template.types"

function createListPath(filters: TemplateListFilters): string {
  const params = new URLSearchParams()
  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.scope) params.set("scope", filters.scope)
  if (filters.partner_id !== undefined) params.set("partner_id", String(filters.partner_id))
  if (filters.status) params.set("status", filters.status)
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.direction) params.set("direction", filters.direction)
  if (filters.per_page !== undefined) params.set("per_page", String(filters.per_page))
  if (filters.page !== undefined) params.set("page", String(filters.page))
  const query = params.toString()
  return query ? `/v1/templates?${query}` : "/v1/templates"
}

function parseTemplate(payload: unknown): TemplateRecord {
  if (!isTemplateResponse(payload)) throw new ApiError("Format response Frame dari server tidak sesuai.", 500)
  return payload.data
}

export async function getTemplates(token: string, filters: TemplateListFilters = {}, signal?: AbortSignal): Promise<TemplateListResponse> {
  const payload = await apiRequest(createListPath(filters), { signal }, token)
  if (!isTemplateListResponse(payload)) throw new ApiError("Format response daftar Frame dari server tidak sesuai.", 500)
  return payload
}

export async function createTemplate(token: string, input: TemplateInput): Promise<TemplateRecord> {
  return parseTemplate(await apiRequest("/v1/templates", { method: "POST", body: JSON.stringify(input) }, token))
}

export async function updateTemplate(token: string, templateId: number, input: TemplateInput): Promise<TemplateRecord> {
  return parseTemplate(await apiRequest(`/v1/templates/${templateId}`, { method: "PUT", body: JSON.stringify(input) }, token))
}

export async function deleteTemplate(token: string, templateId: number): Promise<void> {
  await apiRequest(`/v1/templates/${templateId}`, { method: "DELETE" }, token)
}
