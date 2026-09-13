export interface PublicGalleryMedia {
  id: number
  type: string
  filename: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  duration_seconds: number | null
  download_url: string
}

export interface PublicGalleryRecord {
  session_id: number
  completed_at: string
  expires_at: string
  media: ReadonlyArray<PublicGalleryMedia>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function nullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number" || (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
}

function isMedia(value: unknown): value is PublicGalleryMedia {
  return isRecord(value) && (typeof value.id === "number" || typeof value.id === "string") && typeof value.type === "string" && typeof value.filename === "string" && typeof value.mime_type === "string" && (typeof value.size_bytes === "number" || typeof value.size_bytes === "string") && nullableNumber(value.width) && nullableNumber(value.height) && nullableNumber(value.duration_seconds) && typeof value.download_url === "string"
}

export function isPublicGalleryResponse(value: unknown): value is { data: PublicGalleryRecord } {
  return isRecord(value) && isRecord(value.data) && typeof value.data.session_id === "number" && (value.data.completed_at === null || typeof value.data.completed_at === "string") && (value.data.expires_at === null || typeof value.data.expires_at === "string") && Array.isArray(value.data.media) && value.data.media.every(isMedia)
}
