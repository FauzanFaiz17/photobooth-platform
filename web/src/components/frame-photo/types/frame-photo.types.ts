export type PhotoFrameCategory = "classic" | "minimal" | "wedding" | "graduation" | "birthday" | "corporate" | "seasonal"

export type PhotoFrameStatus = "active" | "draft" | "archived"

export type PhotoFrameOrientation = "portrait" | "landscape" | "square"

export type PhotoFrameLayout = "single_photo" | "vertical_strip" | "horizontal_strip" | "two_photo" | "three_photo" | "four_photo_grid" | "postcard" | "custom"

export type PhotoFrameUnit = "px" | "mm" | "inch"

export type PhotoFrameViewMode = "grid" | "list"

export type PhotoFrameSortOption = "newest" | "oldest" | "most_used" | "least_used" | "name_asc" | "name_desc"

export interface PhotoFrameAsset {
  readonly fileName: string
  readonly mimeType: string
  readonly sizeBytes: number
}

export interface PhotoFrameDimensions {
  readonly width: number
  readonly height: number
  readonly unit: PhotoFrameUnit
}

export interface PhotoFrameKioskAssignment {
  readonly kioskId: string
}

export interface PhotoFrame {
  readonly id: string
  readonly name: string
  readonly code: string
  readonly description: string
  readonly category: PhotoFrameCategory
  readonly tags: ReadonlyArray<string>
  readonly status: PhotoFrameStatus
  readonly orientation: PhotoFrameOrientation
  readonly layout: PhotoFrameLayout
  readonly photoSlotCount: number
  readonly aspectRatio: string
  readonly dimensions: PhotoFrameDimensions
  readonly previewAsset: PhotoFrameAsset | null
  readonly overlayAsset: PhotoFrameAsset | null
  readonly backgroundAsset: PhotoFrameAsset | null
  readonly assignments: ReadonlyArray<PhotoFrameKioskAssignment>
  readonly isDefault: boolean
  readonly usageCount: number
  readonly createdAt: string
  readonly updatedAt: string
}

export interface PhotoFrameFilters {
  readonly query: string
  readonly category: PhotoFrameCategory | "all"
  readonly status: PhotoFrameStatus | "all"
  readonly orientation: PhotoFrameOrientation | "all"
  readonly sort: PhotoFrameSortOption
}

export interface PhotoFrameFormValues {
  readonly name: string
  readonly code: string
  readonly description: string
  readonly category: PhotoFrameCategory
  readonly tags: string
  readonly layout: PhotoFrameLayout
  readonly photoSlotCount: string
  readonly orientation: PhotoFrameOrientation
  readonly aspectRatio: string
  readonly width: string
  readonly height: string
  readonly unit: PhotoFrameUnit
  readonly previewFile: File | null
  readonly overlayFile: File | null
  readonly backgroundFile: File | null
  readonly assignedKioskIds: ReadonlyArray<string>
  readonly isDefault: boolean
  readonly status: PhotoFrameStatus
}

export type FramePhotoKioskStatus = "online" | "offline" | "maintenance"

export interface FramePhotoKiosk {
  readonly id: string
  readonly name: string
  readonly location: string
  readonly status: FramePhotoKioskStatus
  readonly activeFrameName: string
}

export interface PhotoFrameSummary {
  readonly totalFrames: number
  readonly activeFrames: number
  readonly draftFrames: number
  readonly totalUsage: number
}

export interface PhotoFramePaginationState {
  readonly page: number
  readonly pageSize: 10 | 12 | 24 | 48
}

export type PhotoFrameConfirmationAction = "duplicate" | "activate" | "archive" | "delete"

export type PhotoFramePreviewMode = "sample" | "frame-only"

export type FrameFileValidationResult =
  | { readonly valid: true; readonly asset: PhotoFrameAsset }
  | { readonly valid: false; readonly message: string }

