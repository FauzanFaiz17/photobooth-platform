import { Archive, CheckCircle2, Copy, Trash2 } from "lucide-react"
import { useState, type ReactElement } from "react"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { PhotoFrame, PhotoFrameConfirmationAction } from "../types/frame-photo.types"

const actionCopy = {
  duplicate: { title: "Duplicate selected frame?", description: "A draft copy with a new frame code will be created.", confirm: "Duplicate Frame" },
  activate: { title: "Activate selected frames?", description: "The frames will become available for kiosk assignment.", confirm: "Activate" },
  archive: { title: "Archive selected frames?", description: "Archived frames remain in the library but are unavailable for new sessions.", confirm: "Archive" },
  delete: { title: "Delete selected frames?", description: "This permanently removes the selected frames from local state.", confirm: "Delete Frames" },
} satisfies Record<PhotoFrameConfirmationAction, { readonly title: string; readonly description: string; readonly confirm: string }>

export function FramePhotoConfirmationDialog({ frames, action, open, onOpenChange, onConfirm }: { readonly frames: ReadonlyArray<PhotoFrame>; readonly action: PhotoFrameConfirmationAction; readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onConfirm: () => void }): ReactElement {
  const [additionalConfirmation, setAdditionalConfirmation] = useState(false)
  const assignedCount = frames.filter((frame) => frame.assignments.length > 0).length
  const requiresAdditionalConfirmation = action === "delete" && assignedCount > 0
  const copy = actionCopy[action]
  const Icon = action === "duplicate" ? Copy : action === "activate" ? CheckCircle2 : action === "archive" ? Archive : Trash2
  const handleConfirm = (): void => { if (requiresAdditionalConfirmation && !additionalConfirmation) { setAdditionalConfirmation(true); return } onConfirm() }
  return <AlertDialog open={open} onOpenChange={onOpenChange}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia><Icon aria-hidden="true" /></AlertDialogMedia><AlertDialogTitle>{additionalConfirmation ? "Confirm deletion of assigned frames" : copy.title}</AlertDialogTitle><AlertDialogDescription>{additionalConfirmation ? `${assignedCount} frames are still assigned to kiosks. Confirm again to remove them and their assignments.` : `${copy.description} ${frames.length} frame${frames.length === 1 ? "" : "s"} selected.`}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant={action === "delete" ? "destructive" : "default"} onClick={handleConfirm}>{additionalConfirmation ? "Delete Assigned Frames" : copy.confirm}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}

