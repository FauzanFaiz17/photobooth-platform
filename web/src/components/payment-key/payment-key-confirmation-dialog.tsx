import { RotateCcw, Save } from "lucide-react"
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

import type { PaymentKeyConfirmationAction } from "./payment-key.types"

interface PaymentKeyConfirmationDialogProps {
  readonly action: PaymentKeyConfirmationAction | null
  readonly onOpenChange: (open: boolean) => void
  readonly onConfirm: () => void
}

export function PaymentKeyConfirmationDialog({
  action,
  onOpenChange,
  onConfirm,
}: PaymentKeyConfirmationDialogProps): ReactElement {
  const resetting = action === "reset"

  return (
    <AlertDialog open={action !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            {resetting ? <RotateCcw aria-hidden="true" /> : <Save aria-hidden="true" />}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {resetting ? "Reset konfigurasi?" : "Simpan perubahan?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {resetting
              ? "Semua credential dan pengaturan QRIS akan dikosongkan dari state lokal halaman ini."
              : "Credential baru akan disimpan sebagai dummy data aktif pada sesi halaman ini."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant={resetting ? "destructive" : "default"} onClick={onConfirm}>
            {resetting ? "Ya, Reset" : "Ya, Simpan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
