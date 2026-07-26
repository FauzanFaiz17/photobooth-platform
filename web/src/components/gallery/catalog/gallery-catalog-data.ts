import heroImage from "@/assets/hero.png"

import type {
  GalleryCaptureItem,
  GalleryDetailFilters,
  GalleryKioskSummary,
} from "./gallery-catalog.types"

export const galleryKiosks: ReadonlyArray<GalleryKioskSummary> = [
  { id: "KSK-AMEHO", slug: "ameho", name: "AMEHO", totalPhotos: 18, photosToday: 3 },
  { id: "KSK-001", slug: "main-studio", name: "Main Studio Booth", totalPhotos: 18, photosToday: 4 },
  { id: "KSK-002", slug: "sudirman", name: "Booth Sudirman", totalPhotos: 18, photosToday: 2 },
  { id: "KSK-003", slug: "kemang", name: "Booth Kemang", totalPhotos: 18, photosToday: 3 },
  { id: "KSK-004", slug: "senayan", name: "Booth Senayan", totalPhotos: 18, photosToday: 5 },
  { id: "KSK-005", slug: "blok-m", name: "Booth Blok M", totalPhotos: 18, photosToday: 2 },
]

const approvalStatuses = ["approved", "pending", "approved", "approved", "rejected"] as const
const voucherCodes = [null, "PHOTOHEMAT", null, "AMEHO10", null, "WEEKEND25"] as const

export const galleryCaptures: ReadonlyArray<GalleryCaptureItem> = galleryKiosks.flatMap(
  (kiosk, kioskIndex) =>
    Array.from({ length: kiosk.totalPhotos }, (_, photoIndex) => {
      const capturedAt = new Date(2026, 6, 17 - Math.floor(photoIndex / 3), 19 - (photoIndex % 8), 42 - kioskIndex)
      return {
        id: `${kiosk.id}-PHOTO-${String(photoIndex + 1).padStart(3, "0")}`,
        kioskId: kiosk.id,
        thumbnailPath: heroImage,
        capturedAt: capturedAt.toISOString(),
        voucherCode: voucherCodes[(photoIndex + kioskIndex) % voucherCodes.length],
        approvalStatus: approvalStatuses[(photoIndex + kioskIndex) % approvalStatuses.length],
      }
    })
)

export const defaultGalleryDetailFilters: GalleryDetailFilters = {
  dateFrom: "2026-07-01",
  dateTo: "2026-07-17",
  approvalStatus: "all",
  voucherOnly: false,
}

export function findGalleryKiosk(kioskId: string | undefined): GalleryKioskSummary | undefined {
  if (!kioskId) return undefined
  return galleryKiosks.find((kiosk) => kiosk.slug === kioskId || kiosk.id === kioskId)
}

export function getGalleryCaptures(kioskId: string): ReadonlyArray<GalleryCaptureItem> {
  return galleryCaptures.filter((capture) => capture.kioskId === kioskId)
}
