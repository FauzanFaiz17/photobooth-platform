import { Download, Ellipsis, Eye, FolderPlus, Lock, Share2, Archive, Trash2, Globe2 } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { GalleryMedia, GalleryPublicationStatus } from "../types/gallery.types"

export interface GalleryMediaActionHandlers {
  readonly onPreview: (media: GalleryMedia) => void
  readonly onDownload: (ids: ReadonlyArray<string>) => void
  readonly onShare: (media: GalleryMedia) => void
  readonly onAddToAlbum: (ids: ReadonlyArray<string>) => void
  readonly onPublicationChange: (ids: ReadonlyArray<string>, status: GalleryPublicationStatus) => void
  readonly onDelete: (ids: ReadonlyArray<string>) => void
}

export function GalleryMediaActions({ media, handlers }: { readonly media: GalleryMedia; readonly handlers: GalleryMediaActionHandlers }): ReactElement {
  const ids = [media.id]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${media.fileName}`} />}><Ellipsis aria-hidden="true" /></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handlers.onPreview(media)}><Eye aria-hidden="true" /> Preview</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onDownload(ids)}><Download aria-hidden="true" /> Download</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onShare(media)}><Share2 aria-hidden="true" /> Share</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onAddToAlbum(ids)}><FolderPlus aria-hidden="true" /> Add to album</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handlers.onPublicationChange(ids, "published")}><Globe2 aria-hidden="true" /> Publish</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onPublicationChange(ids, "private")}><Lock aria-hidden="true" /> Make private</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlers.onPublicationChange(ids, "archived")}><Archive aria-hidden="true" /> Archive</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => handlers.onDelete(ids)}><Trash2 aria-hidden="true" /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
