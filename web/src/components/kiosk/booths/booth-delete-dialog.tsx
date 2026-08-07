import { LoaderCircle, TriangleAlert } from "lucide-react"
import { useState } from "react"

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
import { useAuth } from "@/features/auth/auth-context"
import { deleteBooth } from "@/features/booths/booth-service"
import type { BoothRecord } from "@/features/booths/booth.types"
import { ApiError } from "@/lib/api-client"

interface BoothDeleteDialogProps {
  readonly booth: BoothRecord
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onDeleted: (booth: BoothRecord) => void
  readonly onUnauthorized: () => void
}

export function BoothDeleteDialog({
  booth,
  open,
  onOpenChange,
  onDeleted,
  onUnauthorized,
}: BoothDeleteDialogProps) {
  const { token } = useAuth()
  const [errorMessage, setErrorMessage] = useState("")
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (!token || pending) return

    setPending(true)
    setErrorMessage("")

    try {
      await deleteBooth(token, booth.id)
      onDeleted(booth)
      onOpenChange(false)
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized()
        return
      }

      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus booth ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Booth {booth.name} akan dihapus. Backend akan menolak jika booth
            masih memiliki device terdaftar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() => void handleDelete()}
          >
            {pending && (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            )}
            Hapus booth
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
