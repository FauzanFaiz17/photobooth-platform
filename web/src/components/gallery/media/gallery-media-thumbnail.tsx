import { FileQuestion } from "lucide-react"
import type { ReactElement } from "react"

import type { GalleryMedia } from "../types/gallery.types"

export function GalleryMediaThumbnail({ media }: { readonly media: GalleryMedia }): ReactElement {
  if (media.thumbnailPath === null) {
    return (
      <div className="flex size-full items-center justify-center bg-muted" role="img" aria-label={`Thumbnail unavailable for ${media.fileName}`}>
        <FileQuestion className="size-8 text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }
  return <img src={media.thumbnailPath} alt={`Preview ${media.fileName} for ${media.customerName}`} className="size-full object-cover" />
}
