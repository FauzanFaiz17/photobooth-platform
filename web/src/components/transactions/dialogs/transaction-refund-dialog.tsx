import { RotateCcw } from "lucide-react"
import { useState, type FormEvent, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { RefundFormValues, RefundReason, RefundType, Transaction } from "../types/transaction.types"
import { formatRupiah, getRefundReasonLabel } from "../utils/transaction-formatters"
import { getRemainingRefundableAmount } from "../utils/transaction-helpers"

const refundReasons = ["customer_request", "technical_issue", "duplicate_payment", "kiosk_failure", "session_cancelled", "other"] satisfies ReadonlyArray<RefundReason>

export function TransactionRefundDialog({ transaction, open, onOpenChange, onConfirm }: { readonly transaction: Transaction; readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onConfirm: (values: RefundFormValues) => void }): ReactElement {
  const remaining = getRemainingRefundableAmount(transaction)
  const [values, setValues] = useState<RefundFormValues>({ type: "full", amount: String(remaining), reason: "customer_request", internalNote: "" })
  const [error, setError] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)

  const handleTypeChange = (type: RefundType): void => {
    setValues((current) => ({ ...current, type, amount: type === "full" ? String(remaining) : "" }))
    setError(null)
  }

  const handleReview = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const amount = Number(values.amount)
    if (!Number.isFinite(amount) || amount <= 0) { setError("Refund amount must be greater than zero."); return }
    if (amount > remaining) { setError(`Refund cannot exceed ${formatRupiah(remaining)}.`); return }
    setError(null)
    setReviewing(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{reviewing ? "Confirm Refund" : "Refund Transaction"}</DialogTitle><DialogDescription>{transaction.id} has {formatRupiah(remaining)} remaining refundable.</DialogDescription></DialogHeader>
        {reviewing ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted p-4 text-sm"><p className="font-medium text-foreground">Refund {formatRupiah(Number(values.amount))}?</p><p className="text-muted-foreground">Reason: {getRefundReasonLabel(values.reason)}. This updates dummy transaction state immediately.</p></div>
        ) : (
          <form id="refund-transaction-form" onSubmit={handleReview} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="refund-type">Refund type</Label><Select<RefundType> value={values.type} onValueChange={(value) => value !== null && handleTypeChange(value)}><SelectTrigger id="refund-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full">Full Refund</SelectItem><SelectItem value="partial">Partial Refund</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="refund-amount">Refund amount</Label><Input id="refund-amount" type="number" min="1" max={remaining} value={values.amount} readOnly={values.type === "full"} aria-invalid={error !== null} aria-describedby={error ? "refund-error" : undefined} onChange={(event) => { setValues((current) => ({ ...current, amount: event.target.value })); setError(null) }} />{error && <p id="refund-error" className="text-sm text-destructive" role="alert">{error}</p>}</div>
            <div className="space-y-2"><Label htmlFor="refund-reason">Refund reason</Label><Select<RefundReason> value={values.reason} onValueChange={(value) => value !== null && setValues((current) => ({ ...current, reason: value }))}><SelectTrigger id="refund-reason"><SelectValue /></SelectTrigger><SelectContent>{refundReasons.map((reason) => <SelectItem key={reason} value={reason}>{getRefundReasonLabel(reason)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="refund-note">Internal note <span className="text-muted-foreground">(optional)</span></Label><Textarea id="refund-note" maxLength={300} value={values.internalNote} onChange={(event) => setValues((current) => ({ ...current, internalNote: event.target.value }))} /></div>
          </form>
        )}
        <DialogFooter><Button variant="outline" onClick={() => reviewing ? setReviewing(false) : onOpenChange(false)}>{reviewing ? "Back" : "Cancel"}</Button>{reviewing ? <Button variant="destructive" onClick={() => onConfirm(values)}><RotateCcw aria-hidden="true" /> Confirm Refund</Button> : <Button type="submit" form="refund-transaction-form">Review Refund</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
