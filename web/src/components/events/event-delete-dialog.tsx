import { LoaderCircle, TriangleAlert } from "lucide-react"
import { useState } from "react"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAuth } from "@/features/auth/auth-context"
import { deleteEvent } from "@/features/events/event-service"
import type { EventRecord } from "@/features/events/event.types"
import { ApiError } from "@/lib/api-client"

export function EventDeleteDialog({
  event,
  open,
  onOpenChange,
  onDeleted,
  onUnauthorized,
  onForbidden,
}: {
  readonly event: EventRecord
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onDeleted: () => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleDelete() {
    if (!token || pending) return
    setPending(true)
    setErrorMessage("")
    try {
      await deleteEvent(token, event.id)
      onDeleted()
      onOpenChange(false)
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      if (error instanceof ApiError && error.status === 403) return onForbidden()
      const validationMessage = error instanceof ApiError ? Object.values(error.validationErrors).flat()[0] : undefined
      setErrorMessage(validationMessage ?? (error instanceof ApiError ? error.message : "Tidak dapat terhubung ke server."))
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogMedia className="bg-destructive/10 text-destructive"><TriangleAlert aria-hidden="true" /></AlertDialogMedia><AlertDialogTitle>Hapus Event?</AlertDialogTitle><AlertDialogDescription>Event {event.event_name} akan dihapus. Backend menolak penghapusan jika Event sudah memiliki photo session.</AlertDialogDescription></AlertDialogHeader>
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        <AlertDialogFooter><AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={pending} onClick={() => void handleDelete()}>{pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}Hapus Event</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
