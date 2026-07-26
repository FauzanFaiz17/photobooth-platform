import { FileImage, Film, Images, type LucideIcon } from "lucide-react"

import type {
  GalleryDownloadStatus,
  GalleryMediaType,
  GalleryPublicationStatus,
  StatusMeta,
} from "../types/gallery.types"

const publicationStatusMeta = {
  published: { label: "Published", variant: "default" },
  private: { label: "Private", variant: "secondary" },
  archived: { label: "Archived", variant: "outline" },
} satisfies Record<GalleryPublicationStatus, StatusMeta>

const downloadStatusMeta = {
  downloaded: { label: "Downloaded", variant: "default" },
  "not-downloaded": { label: "Not downloaded", variant: "outline" },
} satisfies Record<GalleryDownloadStatus, StatusMeta>

export const mediaTypeMeta = {
  photo: { label: "Photo", icon: FileImage },
  gif: { label: "GIF", icon: Images },
  video: { label: "Video", icon: Film },
} satisfies Record<GalleryMediaType, { label: string; icon: LucideIcon }>

export const getPublicationStatusMeta = (
  status: GalleryPublicationStatus
): StatusMeta => publicationStatusMeta[status]

export const getDownloadStatusMeta = (
  status: GalleryDownloadStatus
): StatusMeta => downloadStatusMeta[status]
