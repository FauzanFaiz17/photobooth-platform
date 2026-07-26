export interface GalleryKioskSummary {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly totalPhotos: number
  readonly photosToday: number
}

export type GalleryApprovalStatus = "approved" | "pending" | "rejected"

export interface GalleryCaptureItem {
  readonly id: string
  readonly kioskId: string
  readonly thumbnailPath: string
  readonly capturedAt: string
  readonly voucherCode: string | null
  readonly approvalStatus: GalleryApprovalStatus
}

export interface GalleryDetailFilters {
  readonly dateFrom: string
  readonly dateTo: string
  readonly approvalStatus: GalleryApprovalStatus | "all"
  readonly voucherOnly: boolean
}
