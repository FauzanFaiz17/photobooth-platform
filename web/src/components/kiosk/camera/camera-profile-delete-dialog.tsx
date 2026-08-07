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
import { deleteCameraProfile } from "@/features/camera-profiles/camera-profile-service"
import type { CameraProfileRecord } from "@/features/camera-profiles/camera-profile.types"
import { ApiError } from "@/lib/api-client"

export function CameraProfileDeleteDialog({
  profile,
  open,
  onOpenChange,
  onDeleted,
  onUnauthorized,
}: {
  readonly profile: CameraProfileRecord
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onDeleted: (profile: CameraProfileRecord) => void
  readonly onUnauthorized: () => void
}) {
  const { token } = useAuth()
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleDelete() {
    if (!token || pending) return
    setPending(true)
    setErrorMessage("")

    try {
      await deleteCameraProfile(token, profile.id)
      onDeleted(profile)
      onOpenChange(false)
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized()
        return
      }
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Tidak dapat terhubung ke server."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(value) => !pending && onOpenChange(value)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus camera profile?</AlertDialogTitle>
          <AlertDialogDescription>
            Profile {profile.name} akan dihapus dari Partner ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={() => void handleDelete()}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            Hapus profile
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
