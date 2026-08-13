import { ApiError, apiRequest } from "@/lib/api-client"

import { isPublicGalleryResponse, type PublicGalleryRecord } from "./public-gallery.types"

export async function getPublicGallery(token: string, signal?: AbortSignal): Promise<PublicGalleryRecord> {
  const payload = await apiRequest(`/v1/gallery/${token}`, { signal })
  if (!isPublicGalleryResponse(payload)) {
    throw new ApiError("Format response Public Gallery dari server tidak sesuai.", 500)
  }
  return payload.data
}
