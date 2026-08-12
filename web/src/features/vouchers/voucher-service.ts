import { ApiError, apiRequest } from "@/lib/api-client"

import {
  isVoucherListResponse,
  isVoucherPackageListResponse,
  isVoucherPackageResponse,
  isVoucherResponse,
  type IssueVoucherInput,
  type VoucherListFilters,
  type VoucherListResponse,
  type VoucherPackageInput,
  type VoucherPackageListFilters,
  type VoucherPackageListResponse,
  type VoucherPackageRecord,
  type VoucherRecord,
} from "./voucher.types"

function listPath<Filters extends object>(path: string, filters: Filters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters as Record<string, unknown>)) {
    if (value !== undefined && value !== "") params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

function parsePackage(payload: unknown): VoucherPackageRecord {
  if (!isVoucherPackageResponse(payload)) throw new ApiError("Format response Voucher Package dari server tidak sesuai.", 500)
  return payload.data
}

function parseVoucher(payload: unknown): VoucherRecord {
  if (!isVoucherResponse(payload)) throw new ApiError("Format response Voucher dari server tidak sesuai.", 500)
  return payload.data
}

export async function getVoucherPackages(token: string, filters: VoucherPackageListFilters = {}, signal?: AbortSignal): Promise<VoucherPackageListResponse> {
  const payload = await apiRequest(listPath("/v1/voucher-packages", filters), { signal }, token)
  if (!isVoucherPackageListResponse(payload)) throw new ApiError("Format response daftar Voucher Package dari server tidak sesuai.", 500)
  return payload
}

export async function createVoucherPackage(token: string, input: VoucherPackageInput): Promise<VoucherPackageRecord> {
  return parsePackage(await apiRequest("/v1/voucher-packages", { method: "POST", body: JSON.stringify(input) }, token))
}

export async function updateVoucherPackage(token: string, packageId: number, input: VoucherPackageInput): Promise<VoucherPackageRecord> {
  return parsePackage(await apiRequest(`/v1/voucher-packages/${packageId}`, { method: "PUT", body: JSON.stringify(input) }, token))
}

export async function deleteVoucherPackage(token: string, packageId: number): Promise<void> {
  await apiRequest(`/v1/voucher-packages/${packageId}`, { method: "DELETE" }, token)
}

export async function getVouchers(token: string, filters: VoucherListFilters = {}, signal?: AbortSignal): Promise<VoucherListResponse> {
  const payload = await apiRequest(listPath("/v1/vouchers", filters), { signal }, token)
  if (!isVoucherListResponse(payload)) throw new ApiError("Format response daftar Voucher dari server tidak sesuai.", 500)
  return payload
}

export async function issueVoucher(token: string, input: IssueVoucherInput): Promise<VoucherRecord> {
  return parseVoucher(await apiRequest("/v1/vouchers", { method: "POST", body: JSON.stringify(input) }, token))
}

export async function voidVoucher(token: string, voucherId: number): Promise<VoucherRecord> {
  return parseVoucher(await apiRequest(`/v1/vouchers/${voucherId}/void`, { method: "POST" }, token))
}
