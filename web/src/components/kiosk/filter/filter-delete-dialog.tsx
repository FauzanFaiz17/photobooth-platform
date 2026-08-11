import { LoaderCircle, TriangleAlert } from "lucide-react"
import { useState } from "react"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAuth } from "@/features/auth/auth-context"
import { deleteFilter } from "@/features/filters/filter-service"
import type { FilterRecord } from "@/features/filters/filter.types"
import { ApiError } from "@/lib/api-client"

export function FilterDeleteDialog({
  filter,
  open,
  onOpenChange,
  onDeleted,
  onUnauthorized,
  onForbidden,
}: {
  readonly filter: FilterRecord
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onDeleted: (filter: FilterRecord) => void
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
      await deleteFilter(token, filter.id)
      onDeleted(filter)
      onOpenChange(false)
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      if (error instanceof ApiError && error.status === 403) return onForbidden()
      setErrorMessage(error instanceof ApiError ? error.message : "Tidak dapat terhubung ke server.")
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogMedia className="bg-destructive/10 text-destructive"><TriangleAlert aria-hidden="true" /></AlertDialogMedia><AlertDialogTitle>Hapus Filter?</AlertDialogTitle><AlertDialogDescription>Filter {filter.name} akan dihapus dari Partner ini.</AlertDialogDescription></AlertDialogHeader>{errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}<AlertDialogFooter><AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={pending} onClick={() => void handleDelete()}>{pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}Hapus Filter</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  )
}
