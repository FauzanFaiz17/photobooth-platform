import { Download, Printer } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { Transaction } from "../types/transaction.types"
import { formatDateTime, formatRupiah, getPaymentMethodLabel } from "../utils/transaction-formatters"
import { TransactionPaymentBadge } from "../table/transaction-status-badges"

export function TransactionReceiptDialog({ transaction, open, onOpenChange, onDownload }: { readonly transaction: Transaction | null; readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onDownload: () => void }): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>PhotoLab Indonesia</DialogTitle><DialogDescription>{transaction ? `Receipt ${transaction.receiptNumber}` : "Transaction receipt"}</DialogDescription></DialogHeader>
        {transaction && <div className="space-y-4"><div className="grid gap-1 text-sm"><p className="font-medium text-foreground">{transaction.id}</p><time className="text-muted-foreground" dateTime={transaction.createdAt}>{formatDateTime(transaction.createdAt)}</time><p className="text-muted-foreground">{transaction.customer.name} · {transaction.kiosk.name}</p></div><Separator /><ul className="divide-y divide-border">{transaction.items.map((item) => <li key={item.id} className="flex justify-between gap-4 py-2"><span>{item.name} × {item.quantity}</span><span className="tabular-nums">{formatRupiah(item.unitPrice * item.quantity)}</span></li>)}</ul><Separator /><dl className="space-y-2 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatRupiah(transaction.subtotal)}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd>-{formatRupiah(transaction.discount)}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd>{formatRupiah(transaction.tax)}</dd></div><div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatRupiah(transaction.total)}</dd></div></dl><Separator /><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{getPaymentMethodLabel(transaction.paymentMethod)}</span><TransactionPaymentBadge status={transaction.paymentStatus} /></div></div>}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button><Button variant="outline" onClick={() => window.print()}><Printer aria-hidden="true" /> Print Receipt</Button><Button onClick={onDownload}><Download aria-hidden="true" /> Download Receipt</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

