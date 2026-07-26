import { Trash2 } from "lucide-react"
import type { ReactElement } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import type { ManagedFrame } from "./frame-management.types"

export function FrameDeleteDialog({
  frame,
  onOpenChange,
  onConfirm,
}: {
  readonly frame: ManagedFrame | null
  readonly onOpenChange: (open: boolean) => void
  readonly onConfirm: () => void
}): ReactElement {
  return (
    <AlertDialog open={frame !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia><Trash2 aria-hidden="true" /></AlertDialogMedia>
          <AlertDialogTitle>Hapus frame?</AlertDialogTitle>
          <AlertDialogDescription>
            {frame ? `${frame.name} akan dihapus dari dummy data halaman ini.` : "Frame akan dihapus."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>Hapus</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
