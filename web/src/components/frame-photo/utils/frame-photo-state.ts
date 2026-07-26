import type {
  PhotoFrame,
  PhotoFrameAsset,
  PhotoFrameFormValues,
} from "../types/frame-photo.types"
import { calculateAspectRatio, generateDuplicateFrameName, generateFrameCode, validateFrameFile } from "./frame-photo-utils"

const FRAME_UPDATE_TIME = "2026-07-15T23:30:00+07:00"

function fileToAsset(file: File | null, existing: PhotoFrameAsset | null): PhotoFrameAsset | null {
  if (!file) return existing
  const validation = validateFrameFile(file)
  return validation.valid ? validation.asset : existing
}

export function createFrameFormValues(frame: PhotoFrame | null): PhotoFrameFormValues {
  return {
    name: frame?.name ?? "",
    code: frame?.code ?? "",
    description: frame?.description ?? "",
    category: frame?.category ?? "classic",
    tags: frame?.tags.join(", ") ?? "",
    layout: frame?.layout ?? "single_photo",
    photoSlotCount: String(frame?.photoSlotCount ?? 1),
    orientation: frame?.orientation ?? "portrait",
    aspectRatio: frame?.aspectRatio ?? "2:3",
    width: String(frame?.dimensions.width ?? 1200),
    height: String(frame?.dimensions.height ?? 1800),
    unit: frame?.dimensions.unit ?? "px",
    previewFile: null,
    overlayFile: null,
    backgroundFile: null,
    assignedKioskIds: frame?.assignments.map((assignment) => assignment.kioskId) ?? [],
    isDefault: frame?.isDefault ?? false,
    status: frame?.status ?? "draft",
  }
}

export function savePhotoFrame(values: PhotoFrameFormValues, existing: PhotoFrame | null, sequence: number): PhotoFrame {
  const width = Number(values.width)
  const height = Number(values.height)
  const calculatedRatio = values.aspectRatio.trim() || calculateAspectRatio(width, height)
  return {
    id: existing?.id ?? `frame-custom-${sequence}`,
    name: values.name.trim(),
    code: values.code.trim(),
    description: values.description.trim(),
    category: values.category,
    tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    status: values.status,
    orientation: values.orientation,
    layout: values.layout,
    photoSlotCount: Number(values.photoSlotCount),
    aspectRatio: calculatedRatio,
    dimensions: { width, height, unit: values.unit },
    previewAsset: fileToAsset(values.previewFile, existing?.previewAsset ?? null),
    overlayAsset: fileToAsset(values.overlayFile, existing?.overlayAsset ?? null),
    backgroundAsset: fileToAsset(values.backgroundFile, existing?.backgroundAsset ?? null),
    assignments: values.assignedKioskIds.map((kioskId) => ({ kioskId })),
    isDefault: values.isDefault,
    usageCount: existing?.usageCount ?? 0,
    createdAt: existing?.createdAt ?? FRAME_UPDATE_TIME,
    updatedAt: FRAME_UPDATE_TIME,
  }
}

export function duplicatePhotoFrame(frame: PhotoFrame, sequence: number): PhotoFrame {
  return {
    ...frame,
    id: `frame-copy-${sequence}`,
    name: generateDuplicateFrameName(frame.name),
    code: `${frame.code}_COPY_${sequence}`,
    status: "draft",
    assignments: [],
    isDefault: false,
    usageCount: 0,
    createdAt: FRAME_UPDATE_TIME,
    updatedAt: FRAME_UPDATE_TIME,
  }
}

export function importPhotoFrame(asset: PhotoFrameAsset, sequence: number): PhotoFrame {
  const baseName = asset.fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim()
  const name = baseName.replace(/\b\w/g, (character) => character.toLocaleUpperCase("en-US")) || `Imported Frame ${sequence}`
  return {
    id: `frame-import-${sequence}`,
    name,
    code: `${generateFrameCode(name)}_${sequence}`,
    description: "Imported frame awaiting metadata review.",
    category: "classic",
    tags: ["imported"],
    status: "draft",
    orientation: "portrait",
    layout: "single_photo",
    photoSlotCount: 1,
    aspectRatio: "2:3",
    dimensions: { width: 1200, height: 1800, unit: "px" },
    previewAsset: asset,
    overlayAsset: asset,
    backgroundAsset: null,
    assignments: [],
    isDefault: false,
    usageCount: 0,
    createdAt: FRAME_UPDATE_TIME,
    updatedAt: FRAME_UPDATE_TIME,
  }
}

