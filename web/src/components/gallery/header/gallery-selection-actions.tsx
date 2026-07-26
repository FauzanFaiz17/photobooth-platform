import { Archive, Download, FolderPlus, Globe2, Lock, Trash2, X } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import type { GalleryBulkAction } from "../types/gallery.types"

export function GallerySelectionActions({ count, onAction, onClear }: { readonly count: number; readonly onAction: (action: GalleryBulkAction) => void; readonly onClear: () => void }): ReactElement | null {
  if (count === 0) return null
  return (
    <div className="sticky top-0 z-10 flex flex-col gap-3 border border-border bg-background p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between" role="status" aria-live="polite">
      <div className="flex items-center gap-2"><strong className="text-sm text-foreground">{count} selected</strong><Button variant="ghost" size="sm" onClick={onClear}><X aria-hidden="true" /> Clear</Button></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onAction("download")}><Download aria-hidden="true" /> Download</Button>
        <Button variant="outline" size="sm" onClick={() => onAction("add-to-album")}><FolderPlus aria-hidden="true" /> Add to album</Button>
        <Button variant="outline" size="sm" onClick={() => onAction("publish")}><Globe2 aria-hidden="true" /> Publish</Button>
        <Button variant="outline" size="sm" onClick={() => onAction("make-private")}><Lock aria-hidden="true" /> Private</Button>
        <Button variant="outline" size="sm" onClick={() => onAction("archive")}><Archive aria-hidden="true" /> Archive</Button>
        <Button variant="destructive" size="sm" onClick={() => onAction("delete")}><Trash2 aria-hidden="true" /> Delete</Button>
      </div>
    </div>
  )
}
