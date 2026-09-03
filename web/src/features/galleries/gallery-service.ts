import { API_BASE_URL, ApiError, apiRequest } from "@/lib/api-client"

import {
  isGalleryListResponse,
  type GalleryListFilters,
  type GalleryListResponse,
} from "./gallery.types"

function createListPath(filters: GalleryListFilters): string {
  const params = new URLSearchParams()
  if (filters.partner_id !== undefined) params.set("partner_id", String(filters.partner_id))
  if (filters.per_page !== undefined) params.set("per_page", String(filters.per_page))
  if (filters.page !== undefined) params.set("page", String(filters.page))
  const query = params.toString()
  return query ? `/v1/galleries?${query}` : "/v1/galleries"
}

export async function getGalleries(token: string, filters: GalleryListFilters = {}, signal?: AbortSignal): Promise<GalleryListResponse> {
  const payload = await apiRequest(createListPath(filters), { signal }, token)
  if (!isGalleryListResponse(payload)) throw new ApiError("Format response daftar Gallery dari server tidak sesuai.", 500)
  return payload
}


/**
 * Media hanya bisa diambil lewat route publik bertoken, dan backend mengirimnya sebagai
 * attachment — jadi <img src> tidak bisa dipakai langsung; blob objectURL mengabaikan
 * header Content-Disposition. Pemanggil wajib revoke URL-nya saat selesai.
 */
export async function fetchGalleryMediaUrl(galleryToken: string, mediaId: number, signal?: AbortSignal): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/v1/gallery/${galleryToken}/media/${mediaId}`, { signal })
  if (!response.ok) throw new ApiError("Media gallery tidak dapat dimuat.", response.status)
  return URL.createObjectURL(await response.blob())
}
