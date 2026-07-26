import type { GalleryMedia } from "../types/gallery.types"

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" })
const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
})
const integerFormatter = new Intl.NumberFormat("id-ID")

export const formatDate = (isoDate: string): string =>
  dateFormatter.format(new Date(isoDate))

export const formatDateTime = (isoDate: string): string =>
  dateTimeFormatter.format(new Date(isoDate))

export const formatMediaCount = (value: number): string =>
  integerFormatter.format(value)

export const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB", "TB"] as const
  if (bytes <= 0) return "0 B"

  const unitIndex = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  )
  const value = bytes / 1024 ** unitIndex
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })} ${units[unitIndex]}`
}

export const formatMediaDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export const formatMediaDimensions = (media: GalleryMedia): string =>
  `${media.width} × ${media.height}px`

export const calculateStoragePercentage = (
  usedBytes: number,
  totalBytes: number
): number => {
  if (totalBytes <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((usedBytes / totalBytes) * 100)))
}

export const getMediaSpecificDetails = (
  media: GalleryMedia
): ReadonlyArray<{ label: string; value: string }> => {
  switch (media.type) {
    case "photo":
      return [
        { label: "Dimensions", value: formatMediaDimensions(media) },
        { label: "Format", value: media.format.toUpperCase() },
      ]
    case "gif":
      return [
        { label: "Dimensions", value: formatMediaDimensions(media) },
        { label: "Duration", value: formatMediaDuration(media.durationSeconds) },
        { label: "Frames", value: formatMediaCount(media.frameCount) },
      ]
    case "video":
      return [
        { label: "Dimensions", value: formatMediaDimensions(media) },
        { label: "Duration", value: formatMediaDuration(media.durationSeconds) },
        { label: "Format", value: media.format.toUpperCase() },
      ]
  }
}

export const copyGalleryLink = async (link: string): Promise<boolean> => {
  if (!navigator.clipboard) return false
  try {
    await navigator.clipboard.writeText(link)
    return true
  } catch {
    return false
  }
}
