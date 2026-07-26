import { Download } from "lucide-react"
import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { GalleryMedia } from "../types/gallery.types"
import { formatDate, formatFileSize } from "../utils/gallery-formatters"
import { mediaTypeMeta } from "../utils/gallery-status-mapper"
import { GalleryPublicationBadge } from "../shared/gallery-status-badge"
import { GalleryMediaActions, type GalleryMediaActionHandlers } from "./gallery-media-actions"
import { GalleryMediaThumbnail } from "./gallery-media-thumbnail"

export function GalleryMediaGrid({ items, selectedIds, onSelectedChange, handlers }: { readonly items: ReadonlyArray<GalleryMedia>; readonly selectedIds: ReadonlySet<string>; readonly onSelectedChange: (id: string, selected: boolean) => void; readonly handlers: GalleryMediaActionHandlers }): ReactElement {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((media) => {
        const typeMeta = mediaTypeMeta[media.type]
        return (
          <li key={media.id}>
            <Card className="gap-0 py-0 shadow-none">
              <div className="relative aspect-[4/3] overflow-hidden border-b border-border">
                <GalleryMediaThumbnail media={media} />
                <div className="absolute top-2 left-2"><Checkbox checked={selectedIds.has(media.id)} onCheckedChange={(checked) => onSelectedChange(media.id, checked)} aria-label={`Select ${media.fileName}`} className="bg-background" /></div>
                <Badge variant="secondary" className="absolute right-2 bottom-2"><typeMeta.icon aria-hidden="true" /> {typeMeta.label}</Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-medium text-foreground" title={media.fileName}>{media.fileName}</p><p className="mt-0.5 truncate text-sm text-muted-foreground">{media.customerName} · {media.sessionId}</p></div><GalleryMediaActions media={media} handlers={handlers} /></div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{formatDate(media.createdAt)} · {formatFileSize(media.fileSizeBytes)}</span><span className="inline-flex items-center gap-1"><Download className="size-3" aria-hidden="true" />{media.downloadCount}</span></div>
                <div className="mt-3"><GalleryPublicationBadge status={media.publicationStatus} /></div>
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
