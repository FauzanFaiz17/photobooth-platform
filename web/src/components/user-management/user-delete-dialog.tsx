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
import { deleteUser } from "@/features/users/user-service"
import type { UserRecord } from "@/features/users/user.types"
import { ApiError } from "@/lib/api-client"

interface UserDeleteDialogProps {
  readonly user: UserRecord
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onDeleted: (user: UserRecord) => void
  readonly onUnauthorized: () => void
}

export function UserDeleteDialog({
  user,
  open,
  onOpenChange,
  onDeleted,
  onUnauthorized,
}: UserDeleteDialogProps) {
  const { token } = useAuth()
  const [errorMessage, setErrorMessage] = useState("")
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (!token || pending) return

    setPending(true)
    setErrorMessage("")

    try {
      await deleteUser(token, user.id)
      onDeleted(user)
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
          <AlertDialogTitle>Hapus user ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Akun {user.name} akan dihapus dan tidak dapat digunakan untuk
            login. Backend menolak penghapusan akun sendiri.
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
            Hapus user
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
