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
import { deletePartner } from "@/features/partners/partner-service"
import type { PartnerRecord } from "@/features/partners/partner.types"
import { ApiError } from "@/lib/api-client"

interface PartnerDeleteDialogProps {
  readonly partner: PartnerRecord
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onDeleted: (partner: PartnerRecord) => void
  readonly onUnauthorized: () => void
}

export function PartnerDeleteDialog({
  partner,
  open,
  onOpenChange,
  onDeleted,
  onUnauthorized,
}: PartnerDeleteDialogProps) {
  const { token } = useAuth()
  const [errorMessage, setErrorMessage] = useState("")
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (!token || pending) return

    setPending(true)
    setErrorMessage("")

    try {
      await deletePartner(token, partner.id)
      onDeleted(partner)
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
        if (pending) return
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus partner ini?</AlertDialogTitle>
          <AlertDialogDescription>
            {partner.company_name} akan dihapus dari daftar partner. Server
            menolak penghapusan bila partner masih memiliki user terkait.
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
            Hapus partner
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
