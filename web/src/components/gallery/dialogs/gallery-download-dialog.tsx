import type { ReactElement } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { GalleryMedia } from "../types/gallery.types"
import { formatFileSize } from "../utils/gallery-formatters"

export function GalleryDownloadDialog({ items, open, onOpenChange }: { readonly items: ReadonlyArray<GalleryMedia>; readonly open: boolean; readonly onOpenChange: (open: boolean) => void }): ReactElement {
  const totalSize = items.reduce((sum, item) => sum + item.fileSizeBytes, 0)
  const mediaTypes = [...new Set(items.map((item) => item.type))].join(", ")
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Download summary</DialogTitle><DialogDescription>Review the selected dummy media before continuing.</DialogDescription></DialogHeader><Alert><AlertTitle>Storage is not connected</AlertTitle><AlertDescription>These records are dummy data, so original files are not available for download yet.</AlertDescription></Alert><dl className="grid grid-cols-3 gap-3 py-4 text-sm"><div><dt className="text-muted-foreground">Files</dt><dd className="font-medium">{items.length}</dd></div><div><dt className="text-muted-foreground">Total size</dt><dd className="font-medium">{formatFileSize(totalSize)}</dd></div><div><dt className="text-muted-foreground">Types</dt><dd className="font-medium capitalize">{mediaTypes || "—"}</dd></div></dl><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button><Button disabled={items.length === 0} onClick={() => toast.info("Download unavailable", { description: "Connect real media storage to enable file downloads." })}>Confirm Download</Button></DialogFooter></DialogContent></Dialog>
}
