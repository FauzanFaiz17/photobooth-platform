import { defaultPhotoFrameFilters } from "../data/frame-photo-data"
import type {
  FrameFileValidationResult,
  PhotoFrame,
  PhotoFrameCategory,
  PhotoFrameFilters,
  PhotoFrameLayout,
  PhotoFrameOrientation,
  PhotoFrameSortOption,
  PhotoFrameStatus,
  PhotoFrameUnit,
} from "../types/frame-photo.types"

const usageFormatter = new Intl.NumberFormat("id-ID")
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" })
const MAX_FRAME_FILE_SIZE = 10 * 1024 * 1024

function assertNever(value: never): never {
  throw new Error(`Unhandled frame value: ${String(value)}`)
}

export function formatFrameUsage(value: number): string {
  return usageFormatter.format(value)
}

export function formatFrameDate(value: string): string {
  return dateFormatter.format(new Date(value))
}

export function getCategoryLabel(category: PhotoFrameCategory): string {
  switch (category) {
    case "classic": return "Classic"
    case "minimal": return "Minimal"
    case "wedding": return "Wedding"
    case "graduation": return "Graduation"
    case "birthday": return "Birthday"
    case "corporate": return "Corporate"
    case "seasonal": return "Seasonal"
    default: return assertNever(category)
  }
}

export function getStatusLabel(status: PhotoFrameStatus): string {
  switch (status) {
    case "active": return "Active"
    case "draft": return "Draft"
    case "archived": return "Archived"
    default: return assertNever(status)
  }
}

export function getOrientationLabel(orientation: PhotoFrameOrientation): string {
  switch (orientation) {
    case "portrait": return "Portrait"
    case "landscape": return "Landscape"
    case "square": return "Square"
    default: return assertNever(orientation)
  }
}

export function getLayoutLabel(layout: PhotoFrameLayout): string {
  switch (layout) {
    case "single_photo": return "Single Photo"
    case "vertical_strip": return "Vertical Strip"
    case "horizontal_strip": return "Horizontal Strip"
    case "two_photo": return "Two Photo"
    case "three_photo": return "Three Photo"
    case "four_photo_grid": return "Four Photo Grid"
    case "postcard": return "Postcard"
    case "custom": return "Custom"
    default: return assertNever(layout)
  }
}

export function getUnitLabel(unit: PhotoFrameUnit): string {
  switch (unit) {
    case "px": return "px"
    case "mm": return "mm"
    case "inch": return "inch"
    default: return assertNever(unit)
  }
}

export function generateFrameCode(name: string): string {
  const normalized = name.trim().toLocaleUpperCase("en-US").replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "")
  return `FRM_${normalized || "NEW"}`
}

function greatestCommonDivisor(first: number, second: number): number {
  let a = Math.abs(Math.round(first))
  let b = Math.abs(Math.round(second))
  while (b !== 0) {
    const remainder = a % b
    a = b
    b = remainder
  }
  return a || 1
}

export function calculateAspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "1:1"
  const divisor = greatestCommonDivisor(width, height)
  return `${Math.round(width) / divisor}:${Math.round(height) / divisor}`
}

export function getPreviewAspectRatio(frame: Pick<PhotoFrame, "aspectRatio" | "orientation">): number {
  const [widthValue, heightValue] = frame.aspectRatio.split(":")
  const width = Number(widthValue)
  const height = Number(heightValue)
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) return width / height
  if (frame.orientation === "portrait") return 2 / 3
  if (frame.orientation === "landscape") return 3 / 2
  return 1
}

export function validateFrameFile(file: File, mode: "import" | "design" = "design"): FrameFileValidationResult {
  const allowedTypes = mode === "import"
    ? ["image/png", "image/svg+xml"]
    : ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
  if (!allowedTypes.includes(file.type)) return { valid: false, message: mode === "import" ? "Import accepts PNG or SVG files only." : "Frame assets must be PNG, JPG, WEBP, or SVG." }
  if (file.size > MAX_FRAME_FILE_SIZE) return { valid: false, message: "Frame files cannot exceed 10 MB." }
  return { valid: true, asset: { fileName: file.name, mimeType: file.type, sizeBytes: file.size } }
}

export function filterPhotoFrames(items: ReadonlyArray<PhotoFrame>, filters: PhotoFrameFilters): ReadonlyArray<PhotoFrame> {
  const query = filters.query.trim().toLocaleLowerCase("id-ID")
  return items.filter((frame) => {
    const searchable = [frame.name, frame.code, getCategoryLabel(frame.category), ...frame.tags].join(" ").toLocaleLowerCase("id-ID")
    return (query.length === 0 || searchable.includes(query)) &&
      (filters.category === "all" || frame.category === filters.category) &&
      (filters.status === "all" || frame.status === filters.status) &&
      (filters.orientation === "all" || frame.orientation === filters.orientation)
  })
}

export function sortPhotoFrames(items: ReadonlyArray<PhotoFrame>, sort: PhotoFrameSortOption): ReadonlyArray<PhotoFrame> {
  return [...items].sort((first, second) => {
    if (sort === "newest") return second.updatedAt.localeCompare(first.updatedAt)
    if (sort === "oldest") return first.updatedAt.localeCompare(second.updatedAt)
    if (sort === "most_used") return second.usageCount - first.usageCount
    if (sort === "least_used") return first.usageCount - second.usageCount
    if (sort === "name_asc") return first.name.localeCompare(second.name, "id-ID")
    return second.name.localeCompare(first.name, "id-ID")
  })
}

export function countActiveFrameFilters(filters: PhotoFrameFilters): number {
  let count = 0
  if (filters.query.trim()) count += 1
  if (filters.category !== defaultPhotoFrameFilters.category) count += 1
  if (filters.status !== defaultPhotoFrameFilters.status) count += 1
  if (filters.orientation !== defaultPhotoFrameFilters.orientation) count += 1
  return count
}

export function generateDuplicateFrameName(name: string): string {
  return `${name} Copy`
}

