import { transactionKiosks } from "@/components/transactions/data/transactions-data"
import type {
  FramePhotoKiosk,
  PhotoFrame,
  PhotoFrameCategory,
  PhotoFrameFilters,
  PhotoFrameLayout,
  PhotoFrameOrientation,
  PhotoFrameStatus,
  PhotoFrameSummary,
} from "../types/frame-photo.types"

export const framePhotoKiosks = transactionKiosks.map((kiosk, index) => ({
  ...kiosk,
  status: index === 4 ? "offline" : index === 2 ? "maintenance" : "online",
  activeFrameName: index % 2 === 0 ? "Classic White" : "Minimal Two Shot",
})) satisfies ReadonlyArray<FramePhotoKiosk>

export const defaultPhotoFrameFilters = {
  query: "",
  category: "all",
  status: "all",
  orientation: "all",
  sort: "newest",
} satisfies PhotoFrameFilters

export const photoFrameSummary = {
  totalFrames: 24,
  activeFrames: 18,
  draftFrames: 4,
  totalUsage: 8_642,
} satisfies PhotoFrameSummary

interface PhotoFrameSeed {
  readonly id: string
  readonly name: string
  readonly code: string
  readonly description: string
  readonly category: PhotoFrameCategory
  readonly tags: ReadonlyArray<string>
  readonly status: PhotoFrameStatus
  readonly orientation: PhotoFrameOrientation
  readonly layout: PhotoFrameLayout
  readonly slots: number
  readonly ratio: string
  readonly width: number
  readonly height: number
  readonly kioskIds: ReadonlyArray<string>
  readonly usage: number
  readonly createdAt: string
  readonly updatedAt: string
  readonly isDefault?: boolean
}

function createPhotoFrame(seed: PhotoFrameSeed): PhotoFrame {
  const assetCode = seed.code.toLocaleLowerCase("en-US").replaceAll("_", "-")
  return {
    id: seed.id,
    name: seed.name,
    code: seed.code,
    description: seed.description,
    category: seed.category,
    tags: seed.tags,
    status: seed.status,
    orientation: seed.orientation,
    layout: seed.layout,
    photoSlotCount: seed.slots,
    aspectRatio: seed.ratio,
    dimensions: { width: seed.width, height: seed.height, unit: "px" },
    previewAsset: { fileName: `${assetCode}-preview.webp`, mimeType: "image/webp", sizeBytes: 840_000 },
    overlayAsset: { fileName: `${assetCode}-overlay.png`, mimeType: "image/png", sizeBytes: 1_240_000 },
    backgroundAsset: null,
    assignments: seed.kioskIds.map((kioskId) => ({ kioskId })),
    isDefault: seed.isDefault ?? false,
    usageCount: seed.usage,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
  }
}

const frameSeeds = [
  { id: "frame-001", name: "Classic White", code: "FRM_CLASSIC_001", description: "Clean white portrait frame for everyday sessions.", category: "classic", tags: ["clean", "studio", "popular"], status: "active", orientation: "portrait", layout: "single_photo", slots: 1, ratio: "2:3", width: 1200, height: 1800, kioskIds: ["KSK-001", "KSK-002", "KSK-003"], usage: 1284, createdAt: "2026-01-05T09:00:00+07:00", updatedAt: "2026-07-15T18:20:00+07:00", isDefault: true },
  { id: "frame-002", name: "Graduation Gold", code: "FRM_GRAD_002", description: "Three-shot graduation strip with event title area.", category: "graduation", tags: ["graduation", "gold", "ceremony"], status: "active", orientation: "portrait", layout: "three_photo", slots: 3, ratio: "2:3", width: 1200, height: 1800, kioskIds: ["KSK-001", "KSK-004"], usage: 986, createdAt: "2026-02-12T10:00:00+07:00", updatedAt: "2026-07-14T16:45:00+07:00" },
  { id: "frame-003", name: "Wedding Minimal", code: "FRM_WED_003", description: "Minimal landscape wedding postcard with two photos.", category: "wedding", tags: ["wedding", "minimal", "couple"], status: "active", orientation: "landscape", layout: "two_photo", slots: 2, ratio: "3:2", width: 1800, height: 1200, kioskIds: ["KSK-002", "KSK-003"], usage: 742, createdAt: "2026-02-28T08:30:00+07:00", updatedAt: "2026-07-13T12:15:00+07:00" },
  { id: "frame-004", name: "Vintage Film Strip", code: "FRM_VINTAGE_004", description: "Vertical analog film strip for retro sessions.", category: "classic", tags: ["vintage", "film", "retro"], status: "active", orientation: "portrait", layout: "vertical_strip", slots: 3, ratio: "2:3", width: 1200, height: 1800, kioskIds: ["KSK-001"], usage: 638, createdAt: "2026-03-02T11:00:00+07:00", updatedAt: "2026-07-12T15:50:00+07:00" },
  { id: "frame-005", name: "Birthday Confetti", code: "FRM_BDAY_005", description: "Square celebration collage for birthday events.", category: "birthday", tags: ["birthday", "confetti", "party"], status: "active", orientation: "square", layout: "four_photo_grid", slots: 4, ratio: "1:1", width: 1500, height: 1500, kioskIds: ["KSK-001", "KSK-002", "KSK-004"], usage: 604, createdAt: "2026-03-18T09:20:00+07:00", updatedAt: "2026-07-11T19:10:00+07:00" },
  { id: "frame-006", name: "Corporate Clean", code: "FRM_CORP_006", description: "Branded landscape frame for company gatherings.", category: "corporate", tags: ["corporate", "brand", "clean"], status: "active", orientation: "landscape", layout: "postcard", slots: 1, ratio: "3:2", width: 1800, height: 1200, kioskIds: ["KSK-003"], usage: 521, createdAt: "2026-04-01T13:00:00+07:00", updatedAt: "2026-07-10T10:40:00+07:00" },
  { id: "frame-007", name: "Black and White Booth", code: "FRM_BW_007", description: "Four-shot monochrome inspired booth layout.", category: "minimal", tags: ["monochrome", "timeless", "grid"], status: "active", orientation: "square", layout: "four_photo_grid", slots: 4, ratio: "1:1", width: 1500, height: 1500, kioskIds: ["KSK-002"], usage: 498, createdAt: "2026-04-08T14:00:00+07:00", updatedAt: "2026-07-09T11:25:00+07:00" },
  { id: "frame-008", name: "Summer Holiday", code: "FRM_SUMMER_008", description: "Seasonal postcard for summer pop-up events.", category: "seasonal", tags: ["summer", "holiday", "postcard"], status: "draft", orientation: "landscape", layout: "postcard", slots: 2, ratio: "3:2", width: 1800, height: 1200, kioskIds: [], usage: 0, createdAt: "2026-07-01T09:00:00+07:00", updatedAt: "2026-07-08T17:30:00+07:00" },
  { id: "frame-009", name: "Elegant Floral", code: "FRM_FLORAL_009", description: "Portrait floral border for intimate wedding events.", category: "wedding", tags: ["floral", "elegant", "portrait"], status: "active", orientation: "portrait", layout: "single_photo", slots: 1, ratio: "2:3", width: 1200, height: 1800, kioskIds: ["KSK-004"], usage: 467, createdAt: "2026-04-20T09:00:00+07:00", updatedAt: "2026-07-07T14:30:00+07:00" },
  { id: "frame-010", name: "Retro Postcard", code: "FRM_RETRO_010", description: "Landscape postcard with vintage event caption.", category: "classic", tags: ["retro", "postcard", "event"], status: "archived", orientation: "landscape", layout: "postcard", slots: 1, ratio: "3:2", width: 1800, height: 1200, kioskIds: [], usage: 389, createdAt: "2026-01-22T09:00:00+07:00", updatedAt: "2026-07-06T10:10:00+07:00" },
  { id: "frame-011", name: "Graduation Portrait", code: "FRM_GRAD_011", description: "Single portrait with school and graduation text zones.", category: "graduation", tags: ["graduation", "portrait", "school"], status: "active", orientation: "portrait", layout: "single_photo", slots: 1, ratio: "2:3", width: 1200, height: 1800, kioskIds: ["KSK-001", "KSK-003"], usage: 812, createdAt: "2026-03-10T09:00:00+07:00", updatedAt: "2026-07-05T20:20:00+07:00" },
  { id: "frame-012", name: "Minimal Two Shot", code: "FRM_MIN_012", description: "Balanced two-photo layout with compact caption.", category: "minimal", tags: ["minimal", "two-shot", "clean"], status: "active", orientation: "portrait", layout: "two_photo", slots: 2, ratio: "2:3", width: 1200, height: 1800, kioskIds: ["KSK-001", "KSK-002", "KSK-003", "KSK-004"], usage: 1047, createdAt: "2026-03-25T09:00:00+07:00", updatedAt: "2026-07-04T13:45:00+07:00" },
  { id: "frame-013", name: "Birthday Three Pop", code: "FRM_BDAY_013", description: "Three-photo strip with celebration headline.", category: "birthday", tags: ["birthday", "three-shot", "fun"], status: "active", orientation: "portrait", layout: "three_photo", slots: 3, ratio: "2:3", width: 1200, height: 1800, kioskIds: ["KSK-002"], usage: 356, createdAt: "2026-05-01T09:00:00+07:00", updatedAt: "2026-07-03T16:20:00+07:00" },
  { id: "frame-014", name: "Corporate Headshot", code: "FRM_CORP_014", description: "Single square headshot for staff and conference badges.", category: "corporate", tags: ["headshot", "corporate", "badge"], status: "draft", orientation: "square", layout: "single_photo", slots: 1, ratio: "1:1", width: 1500, height: 1500, kioskIds: [], usage: 12, createdAt: "2026-06-20T09:00:00+07:00", updatedAt: "2026-07-02T11:10:00+07:00" },
  { id: "frame-015", name: "Wedding Four Grid", code: "FRM_WED_015", description: "Four-image square collage for wedding receptions.", category: "wedding", tags: ["wedding", "collage", "grid"], status: "active", orientation: "square", layout: "four_photo_grid", slots: 4, ratio: "1:1", width: 1500, height: 1500, kioskIds: ["KSK-003", "KSK-004"], usage: 442, createdAt: "2026-05-14T09:00:00+07:00", updatedAt: "2026-06-30T18:00:00+07:00" },
  { id: "frame-016", name: "New Year Spark", code: "FRM_NY_016", description: "Seasonal horizontal strip prepared for New Year events.", category: "seasonal", tags: ["new-year", "seasonal", "strip"], status: "archived", orientation: "landscape", layout: "horizontal_strip", slots: 3, ratio: "3:2", width: 1800, height: 1200, kioskIds: [], usage: 302, createdAt: "2025-12-01T09:00:00+07:00", updatedAt: "2026-06-28T09:10:00+07:00" },
  { id: "frame-017", name: "Classic Four Cut", code: "FRM_CLASSIC_017", description: "Classic four-cut vertical booth strip.", category: "classic", tags: ["classic", "four-cut", "strip"], status: "active", orientation: "portrait", layout: "vertical_strip", slots: 4, ratio: "2:3", width: 1200, height: 1800, kioskIds: ["KSK-001", "KSK-005"], usage: 584, createdAt: "2026-01-30T09:00:00+07:00", updatedAt: "2026-06-25T12:00:00+07:00" },
  { id: "frame-018", name: "Minimal Landscape", code: "FRM_MIN_018", description: "Wide single-photo layout for group portraits.", category: "minimal", tags: ["minimal", "landscape", "group"], status: "active", orientation: "landscape", layout: "single_photo", slots: 1, ratio: "3:2", width: 1800, height: 1200, kioskIds: ["KSK-002"], usage: 328, createdAt: "2026-05-22T09:00:00+07:00", updatedAt: "2026-06-22T10:35:00+07:00" },
  { id: "frame-019", name: "Graduation Four Grid", code: "FRM_GRAD_019", description: "Square graduation collage for classmates.", category: "graduation", tags: ["graduation", "group", "grid"], status: "draft", orientation: "square", layout: "four_photo_grid", slots: 4, ratio: "1:1", width: 1500, height: 1500, kioskIds: [], usage: 28, createdAt: "2026-06-18T09:00:00+07:00", updatedAt: "2026-06-20T15:00:00+07:00" },
  { id: "frame-020", name: "Ramadan Together", code: "FRM_RAMADAN_020", description: "Seasonal two-photo portrait with greeting area.", category: "seasonal", tags: ["ramadan", "seasonal", "family"], status: "draft", orientation: "portrait", layout: "two_photo", slots: 2, ratio: "2:3", width: 1200, height: 1800, kioskIds: [], usage: 74, createdAt: "2026-03-01T09:00:00+07:00", updatedAt: "2026-06-18T13:40:00+07:00" },
  { id: "frame-021", name: "Monochrome Portrait", code: "FRM_MONO_021", description: "Single-photo monochrome portrait for editorial sessions.", category: "minimal", tags: ["monochrome", "portrait", "editorial"], status: "active", orientation: "portrait", layout: "single_photo", slots: 1, ratio: "2:3", width: 1200, height: 1800, kioskIds: ["KSK-001"], usage: 215, createdAt: "2026-05-28T09:00:00+07:00", updatedAt: "2026-06-16T12:15:00+07:00" },
  { id: "frame-022", name: "Winter Postcard", code: "FRM_WINTER_022", description: "Wide seasonal postcard with a compact event caption.", category: "seasonal", tags: ["winter", "postcard", "seasonal"], status: "active", orientation: "landscape", layout: "postcard", slots: 2, ratio: "3:2", width: 1800, height: 1200, kioskIds: ["KSK-004"], usage: 180, createdAt: "2026-05-30T09:00:00+07:00", updatedAt: "2026-06-14T17:20:00+07:00" },
  { id: "frame-023", name: "Corporate Two Shot", code: "FRM_CORP_023", description: "Two-photo branded layout for conferences and staff events.", category: "corporate", tags: ["corporate", "conference", "two-shot"], status: "active", orientation: "landscape", layout: "two_photo", slots: 2, ratio: "3:2", width: 1800, height: 1200, kioskIds: ["KSK-003"], usage: 146, createdAt: "2026-06-01T09:00:00+07:00", updatedAt: "2026-06-12T10:30:00+07:00" },
  { id: "frame-024", name: "Wedding Vertical Strip", code: "FRM_WED_024", description: "Three-photo wedding strip with names and reception date.", category: "wedding", tags: ["wedding", "vertical-strip", "reception"], status: "active", orientation: "portrait", layout: "vertical_strip", slots: 3, ratio: "2:3", width: 1200, height: 1800, kioskIds: ["KSK-002"], usage: 109, createdAt: "2026-06-03T09:00:00+07:00", updatedAt: "2026-06-10T19:45:00+07:00" },
] satisfies ReadonlyArray<PhotoFrameSeed>

export const initialPhotoFrames = frameSeeds.map(createPhotoFrame) satisfies ReadonlyArray<PhotoFrame>
