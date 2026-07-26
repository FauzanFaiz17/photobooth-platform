export type GalleryMediaType = "photo" | "gif" | "video"
export type GalleryPublicationStatus = "published" | "private" | "archived"
export type GalleryDownloadStatus = "downloaded" | "not-downloaded"
export type GallerySortOption =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "largest"
  | "most-downloaded"
export type GalleryViewMode = "grid" | "list"
export type GalleryTab = "all" | "albums" | "shared" | "archived"
export type GalleryBulkAction =
  | "download"
  | "add-to-album"
  | "publish"
  | "make-private"
  | "archive"
  | "delete"

export interface GalleryMediaBase {
  readonly id: string
  readonly fileName: string
  readonly sessionId: string
  readonly customerName: string
  readonly albumIds: ReadonlyArray<string>
  readonly createdAt: string
  readonly fileSizeBytes: number
  readonly downloadCount: number
  readonly publicationStatus: GalleryPublicationStatus
  readonly downloadStatus: GalleryDownloadStatus
  readonly thumbnailPath: string | null
}

export interface GalleryPhotoMedia extends GalleryMediaBase {
  readonly type: "photo"
  readonly width: number
  readonly height: number
  readonly format: "jpg" | "jpeg" | "png" | "webp"
}

export interface GalleryGifMedia extends GalleryMediaBase {
  readonly type: "gif"
  readonly width: number
  readonly height: number
  readonly durationSeconds: number
  readonly frameCount: number
  readonly format: "gif"
}

export interface GalleryVideoMedia extends GalleryMediaBase {
  readonly type: "video"
  readonly width: number
  readonly height: number
  readonly durationSeconds: number
  readonly format: "mp4" | "webm"
}

export type GalleryMedia =
  | GalleryPhotoMedia
  | GalleryGifMedia
  | GalleryVideoMedia

export type GalleryAlbumStatus = GalleryPublicationStatus

export interface GalleryAlbum {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly coverMediaId: string | null
  readonly mediaIds: ReadonlyArray<string>
  readonly createdAt: string
  readonly status: GalleryAlbumStatus
  readonly publicSlug: string | null
}

export interface GallerySummary {
  readonly totalMedia: number
  readonly totalSessions: number
  readonly publishedAlbums: number
  readonly storageUsedGb: number
  readonly storageTotalGb: number
}

export interface GalleryStorageSummary {
  readonly totalBytes: number
  readonly usedBytes: number
  readonly availableBytes: number
  readonly mediaCount: number
  readonly largestMediaType: GalleryMediaType
}

export interface GalleryFilters {
  readonly query: string
  readonly mediaType: GalleryMediaType | "all"
  readonly publicationStatus: GalleryPublicationStatus | "all"
  readonly downloadStatus: GalleryDownloadStatus | "all"
  readonly albumId: string | "all"
  readonly dateFrom: string | null
  readonly dateTo: string | null
  readonly sort: GallerySortOption
}

export interface GalleryPaginationState {
  readonly page: number
  readonly pageSize: 12 | 24 | 48
}

export interface GalleryAlbumFormValues {
  readonly name: string
  readonly description: string
  readonly status: GalleryAlbumStatus
  readonly enablePublicGallery: boolean
}

export interface GalleryUploadFormValues {
  readonly fileName: string
  readonly customerName: string
  readonly mediaType: GalleryMediaType
}

export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"

export interface StatusMeta {
  readonly label: string
  readonly variant: StatusBadgeVariant
}
