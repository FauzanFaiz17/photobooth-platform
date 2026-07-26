import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"

import type {
  GalleryDownloadStatus,
  GalleryPublicationStatus,
} from "../types/gallery.types"
import {
  getDownloadStatusMeta,
  getPublicationStatusMeta,
} from "../utils/gallery-status-mapper"

export function GalleryPublicationBadge({
  status,
}: {
  readonly status: GalleryPublicationStatus
}): ReactElement {
  const meta = getPublicationStatusMeta(status)
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

export function GalleryDownloadBadge({
  status,
}: {
  readonly status: GalleryDownloadStatus
}): ReactElement {
  const meta = getDownloadStatusMeta(status)
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}
