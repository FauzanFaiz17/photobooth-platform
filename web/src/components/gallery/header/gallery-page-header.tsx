import { FolderPlus, Upload } from "lucide-react"
import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { formatMediaCount } from "../utils/gallery-formatters"

interface GalleryPageHeaderProps {
  readonly totalMedia: number
  readonly onCreateAlbum: () => void
  readonly onUploadMedia: () => void
}

export function GalleryPageHeader({
  totalMedia,
  onCreateAlbum,
  onUploadMedia,
}: GalleryPageHeaderProps): ReactElement {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Gallery</h1>
          <Badge variant="outline">{formatMediaCount(totalMedia)} media</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Kelola foto, GIF, video, dan hasil sesi photobooth.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={onCreateAlbum}>
          <FolderPlus aria-hidden="true" /> Create Album
        </Button>
        <Button onClick={onUploadMedia}>
          <Upload aria-hidden="true" /> Upload Media
        </Button>
      </div>
    </header>
  )
}
