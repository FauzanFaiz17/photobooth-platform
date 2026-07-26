import { useState, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { GalleryAlbum } from "../types/gallery.types"

export function GalleryAddToAlbumDialog({ open, mediaCount, albums, onOpenChange, onApply }: { readonly open: boolean; readonly mediaCount: number; readonly albums: ReadonlyArray<GalleryAlbum>; readonly onOpenChange: (open: boolean) => void; readonly onApply: (albumIds: ReadonlyArray<string>) => void }): ReactElement {
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<ReadonlySet<string>>(() => new Set<string>())
  const handleOpen = (next: boolean): void => { if (next) setSelectedAlbumIds(new Set<string>()); onOpenChange(next) }
  return <Dialog open={open} onOpenChange={handleOpen}><DialogContent><DialogHeader><DialogTitle>Add to album</DialogTitle><DialogDescription>Add {mediaCount} media without creating duplicates.</DialogDescription></DialogHeader><div className="space-y-3 py-4">{albums.length === 0 ? <p className="text-sm text-muted-foreground">No albums available.</p> : albums.map((album) => <div key={album.id} className="flex items-center justify-between gap-3 border-b border-border pb-3"><Label htmlFor={`album-${album.id}`} className="flex-1">{album.name} <span className="text-muted-foreground">({album.mediaIds.length})</span></Label><Checkbox id={`album-${album.id}`} checked={selectedAlbumIds.has(album.id)} onCheckedChange={(checked) => setSelectedAlbumIds((current) => { const next = new Set(current); if (checked) next.add(album.id); else next.delete(album.id); return next })} /></div>)}</div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={selectedAlbumIds.size === 0} onClick={() => { onApply([...selectedAlbumIds]); onOpenChange(false) }}>Apply</Button></DialogFooter></DialogContent></Dialog>
}
