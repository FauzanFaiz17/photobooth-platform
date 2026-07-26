import { Download, FolderPlus, Share2, Trash2 } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { GalleryAlbum, GalleryMedia } from "../types/gallery.types"
import { formatDateTime, formatFileSize, getMediaSpecificDetails } from "../utils/gallery-formatters"
import { mediaTypeMeta } from "../utils/gallery-status-mapper"
import { GalleryPublicationBadge } from "../shared/gallery-status-badge"
import { GalleryMediaThumbnail } from "../media/gallery-media-thumbnail"

export function GalleryMediaPreview({ media, albums, open, onOpenChange, onDownload, onShare, onAddToAlbum, onDelete }: { readonly media: GalleryMedia | null; readonly albums: ReadonlyArray<GalleryAlbum>; readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onDownload: (ids: ReadonlyArray<string>) => void; readonly onShare: (media: GalleryMedia) => void; readonly onAddToAlbum: (ids: ReadonlyArray<string>) => void; readonly onDelete: (ids: ReadonlyArray<string>) => void }): ReactElement {
  const albumNames = media?.albumIds.map((id) => albums.find((album) => album.id === id)?.name).filter((name): name is string => Boolean(name)) ?? []
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {media ? <><DialogHeader><DialogTitle>{media.fileName}</DialogTitle><DialogDescription>{mediaTypeMeta[media.type].label} preview and session metadata.</DialogDescription></DialogHeader><div className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]"><div className="aspect-[4/3] overflow-hidden border border-border"><GalleryMediaThumbnail media={media} /></div><div><GalleryPublicationBadge status={media.publicationStatus} /><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-muted-foreground">Customer</dt><dd className="font-medium text-foreground">{media.customerName}</dd></div><div><dt className="text-muted-foreground">Session</dt><dd className="font-mono text-xs text-foreground">{media.sessionId}</dd></div><div><dt className="text-muted-foreground">Albums</dt><dd className="text-foreground">{albumNames.join(", ") || "Unassigned"}</dd></div><div><dt className="text-muted-foreground">Created</dt><dd><time dateTime={media.createdAt}>{formatDateTime(media.createdAt)}</time></dd></div><div><dt className="text-muted-foreground">File size</dt><dd>{formatFileSize(media.fileSizeBytes)}</dd></div><div><dt className="text-muted-foreground">Downloads</dt><dd>{media.downloadCount}</dd></div>{getMediaSpecificDetails(media).map((detail) => <div key={detail.label}><dt className="text-muted-foreground">{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl></div></div><Separator /><DialogFooter className="flex-wrap"><Button variant="outline" onClick={() => onDownload([media.id])}><Download aria-hidden="true" /> Download</Button><Button variant="outline" onClick={() => onShare(media)}><Share2 aria-hidden="true" /> Share</Button><Button variant="outline" onClick={() => onAddToAlbum([media.id])}><FolderPlus aria-hidden="true" /> Add to album</Button><Button variant="destructive" onClick={() => onDelete([media.id])}><Trash2 aria-hidden="true" /> Delete</Button></DialogFooter></> : <><DialogHeader><DialogTitle>Preview unavailable</DialogTitle><DialogDescription>Select a media item to open its preview.</DialogDescription></DialogHeader></>}
      </DialogContent>
    </Dialog>
  )
}
