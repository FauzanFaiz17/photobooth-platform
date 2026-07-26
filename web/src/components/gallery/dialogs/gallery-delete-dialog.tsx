import { Trash2 } from "lucide-react"
import type { ReactElement } from "react"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { GalleryMedia } from "../types/gallery.types"

export function GalleryDeleteDialog({ items, open, onOpenChange, onConfirm }: { readonly items: ReadonlyArray<GalleryMedia>; readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onConfirm: () => void }): ReactElement {
  const title = items.length === 1 ? items[0]?.fileName : `${items.length} media items`
  return <AlertDialog open={open} onOpenChange={onOpenChange}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia><Trash2 aria-hidden="true" /></AlertDialogMedia><AlertDialogTitle>Delete {title}?</AlertDialogTitle><AlertDialogDescription>This cannot be undone. Media will also be removed from every album that references it.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { onConfirm(); onOpenChange(false) }}>Delete Media</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}
