import { Ban, CheckCircle2 } from "lucide-react"
import type { ReactElement } from "react"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { Transaction, TransactionConfirmationAction } from "../types/transaction.types"

export function TransactionConfirmationDialog({ transaction, action, open, onOpenChange, onConfirm }: { readonly transaction: Transaction | null; readonly action: TransactionConfirmationAction; readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onConfirm: () => void }): ReactElement {
  const completing = action === "complete"
  return <AlertDialog open={open} onOpenChange={onOpenChange}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia>{completing ? <CheckCircle2 aria-hidden="true" /> : <Ban aria-hidden="true" />}</AlertDialogMedia><AlertDialogTitle>{completing ? "Mark transaction as completed?" : "Cancel this transaction?"}</AlertDialogTitle><AlertDialogDescription>{transaction ? `${transaction.id} will be updated locally. ${completing ? "The session will be recorded as completed." : "This action marks the transaction as cancelled."}` : "Select a transaction first."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep unchanged</AlertDialogCancel><AlertDialogAction variant={completing ? "default" : "destructive"} onClick={onConfirm}>{completing ? "Mark Completed" : "Cancel Transaction"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}

