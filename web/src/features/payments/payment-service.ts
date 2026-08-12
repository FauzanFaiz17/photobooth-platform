import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isPaymentListResponse,
  isPaymentResponse,
  type PaymentListFilters,
  type PaymentListResponse,
  type PaymentRecord,
  type PaymentTransitionStatus,
} from "./payment.types"

function createListPath(filters: PaymentListFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `/v1/payments?${query}` : "/v1/payments"
}

function parsePayment(payload: unknown): PaymentRecord {
  if (!isPaymentResponse(payload)) throw new ApiError("Format response Payment dari server tidak sesuai.", 500)
  return payload.data
}

export async function getPayments(token: string, filters: PaymentListFilters = {}, signal?: AbortSignal): Promise<PaymentListResponse> {
  const payload = await apiRequest(createListPath(filters), { signal }, token)
  if (!isPaymentListResponse(payload)) throw new ApiError("Format response daftar Payment dari server tidak sesuai.", 500)
  return payload
}

export async function getPayment(token: string, paymentId: number): Promise<PaymentRecord> {
  return parsePayment(await apiRequest(`/v1/payments/${paymentId}`, {}, token))
}

export async function transitionPayment(token: string, paymentId: number, status: PaymentTransitionStatus): Promise<PaymentRecord> {
  return parsePayment(await apiRequest(`/v1/payments/${paymentId}/transition`, { method: "POST", body: JSON.stringify({ status }) }, token))
}
