import { Plus } from "lucide-react"
import { useState, type FormEvent, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { transactionKiosks, transactionPackages } from "../data/transactions-data"
import type { CreateTransactionValues, PaymentMethod } from "../types/transaction.types"
import { getPaymentMethodLabel } from "../utils/transaction-formatters"

const paymentMethods = ["qris", "cash", "debit_card", "credit_card", "bank_transfer", "e_wallet"] satisfies ReadonlyArray<PaymentMethod>

export function CreateTransactionDialog({ open, onOpenChange, onCreate }: { readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onCreate: (values: CreateTransactionValues) => void }): ReactElement {
  const firstPackage = transactionPackages[0]
  const [values, setValues] = useState<CreateTransactionValues>({ customerName: "", kioskId: transactionKiosks[0].id, packageId: firstPackage.id, paymentMethod: "qris", amount: String(firstPackage.price) })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (values.customerName.trim().length < 3) { setError("Customer name must contain at least 3 characters."); return }
    const amount = Number(values.amount)
    if (!Number.isFinite(amount) || amount <= 0) { setError("Amount must be greater than zero."); return }
    if (!transactionKiosks.some((kiosk) => kiosk.id === values.kioskId) || !transactionPackages.some((item) => item.id === values.packageId)) { setError("Select a valid kiosk and package."); return }
    setError(null)
    onCreate({ ...values, customerName: values.customerName.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create Transaction</DialogTitle><DialogDescription>Add a local dummy transaction without sending data to a backend.</DialogDescription></DialogHeader>
        <form id="create-transaction-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2"><Label htmlFor="create-customer">Customer name</Label><Input id="create-customer" value={values.customerName} aria-invalid={error !== null} onChange={(event) => { setValues((current) => ({ ...current, customerName: event.target.value })); setError(null) }} /></div>
          <div className="space-y-2"><Label htmlFor="create-kiosk">Kiosk</Label><Select<string> value={values.kioskId} onValueChange={(value) => value !== null && setValues((current) => ({ ...current, kioskId: value }))}><SelectTrigger id="create-kiosk"><SelectValue /></SelectTrigger><SelectContent>{transactionKiosks.map((kiosk) => <SelectItem key={kiosk.id} value={kiosk.id}>{kiosk.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="create-package">Package</Label><Select<string> value={values.packageId} onValueChange={(value) => { const selected = transactionPackages.find((item) => item.id === value); if (selected) setValues((current) => ({ ...current, packageId: selected.id, amount: String(selected.price) })) }}><SelectTrigger id="create-package"><SelectValue /></SelectTrigger><SelectContent>{transactionPackages.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="create-payment-method">Payment method</Label><Select<PaymentMethod> value={values.paymentMethod} onValueChange={(value) => value !== null && setValues((current) => ({ ...current, paymentMethod: value }))}><SelectTrigger id="create-payment-method"><SelectValue /></SelectTrigger><SelectContent>{paymentMethods.map((method) => <SelectItem key={method} value={method}>{getPaymentMethodLabel(method)}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="create-amount">Amount</Label><Input id="create-amount" type="number" min="1" value={values.amount} aria-invalid={error !== null} aria-describedby={error ? "create-transaction-error" : undefined} onChange={(event) => { setValues((current) => ({ ...current, amount: event.target.value })); setError(null) }} />{error && <p id="create-transaction-error" className="text-sm text-destructive" role="alert">{error}</p>}</div>
        </form>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="create-transaction-form"><Plus aria-hidden="true" /> Create Transaction</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
