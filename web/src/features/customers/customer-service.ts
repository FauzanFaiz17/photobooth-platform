import { ApiError, apiRequest } from "@/lib/api-client"

import { isCustomerListResponse, isCustomerResponse, type CustomerListResponse, type CustomerRecord } from "./customer.types"

export async function getCustomers(token: string, filters: { readonly search?: string; readonly partner_id?: number; readonly page?: number }, signal?: AbortSignal): Promise<CustomerListResponse> {
  const params = new URLSearchParams({ per_page: "10", sort: "created_at", direction: "desc" })
  if (filters.search) params.set("search", filters.search)
  if (filters.partner_id !== undefined) params.set("partner_id", String(filters.partner_id))
  if (filters.page !== undefined) params.set("page", String(filters.page))
  const payload = await apiRequest(`/v1/customers?${params}`, { signal }, token)
  if (!isCustomerListResponse(payload)) throw new ApiError("Format response daftar Customer dari server tidak sesuai.", 500)
  return payload
}

export async function getCustomer(token: string, customerId: number): Promise<CustomerRecord> {
  const payload = await apiRequest(`/v1/customers/${customerId}`, {}, token)
  if (!isCustomerResponse(payload)) throw new ApiError("Format response Customer dari server tidak sesuai.", 500)
  return payload.data
}
