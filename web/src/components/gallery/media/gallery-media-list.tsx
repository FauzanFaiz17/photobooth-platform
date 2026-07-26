import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { GalleryMedia } from "../types/gallery.types"
import { formatDate, formatFileSize } from "../utils/gallery-formatters"
import { mediaTypeMeta } from "../utils/gallery-status-mapper"
import { GalleryPublicationBadge } from "../shared/gallery-status-badge"
import { GalleryMediaActions, type GalleryMediaActionHandlers } from "./gallery-media-actions"
import { GalleryMediaThumbnail } from "./gallery-media-thumbnail"

export function GalleryMediaList({ items, selectedIds, onSelectedChange, handlers }: { readonly items: ReadonlyArray<GalleryMedia>; readonly selectedIds: ReadonlySet<string>; readonly onSelectedChange: (id: string, selected: boolean) => void; readonly handlers: GalleryMediaActionHandlers }): ReactElement {
  return (
    <Table>
      <TableHeader><TableRow><TableHead><span className="sr-only">Select</span></TableHead><TableHead>Preview</TableHead><TableHead>File name</TableHead><TableHead>Type</TableHead><TableHead>Session</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Size</TableHead><TableHead>Downloads</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
      <TableBody>{items.map((media) => { const typeMeta = mediaTypeMeta[media.type]; return (
        <TableRow key={media.id}>
          <TableCell><Checkbox checked={selectedIds.has(media.id)} onCheckedChange={(checked) => onSelectedChange(media.id, checked)} aria-label={`Select ${media.fileName}`} /></TableCell>
          <TableCell><div className="h-12 w-16 overflow-hidden rounded-md border border-border"><GalleryMediaThumbnail media={media} /></div></TableCell>
          <TableCell className="max-w-52"><Tooltip><TooltipTrigger render={<span className="block truncate font-medium" />}>{media.fileName}</TooltipTrigger><TooltipContent>{media.fileName}</TooltipContent></Tooltip></TableCell>
          <TableCell><Badge variant="outline"><typeMeta.icon aria-hidden="true" />{typeMeta.label}</Badge></TableCell>
          <TableCell className="font-mono text-xs">{media.sessionId}</TableCell><TableCell>{media.customerName}</TableCell><TableCell><time dateTime={media.createdAt}>{formatDate(media.createdAt)}</time></TableCell><TableCell>{formatFileSize(media.fileSizeBytes)}</TableCell><TableCell>{media.downloadCount}</TableCell><TableCell><GalleryPublicationBadge status={media.publicationStatus} /></TableCell><TableCell><GalleryMediaActions media={media} handlers={handlers} /></TableCell>
        </TableRow>
      )})}</TableBody>
    </Table>
  )
}
