import { Circle } from "lucide-react"
import type { ReactElement } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Transaction } from "../types/transaction.types"
import { formatDateTime, formatRupiah, getPaymentMethodLabel, getRefundReasonLabel } from "../utils/transaction-formatters"
import { getRemainingRefundableAmount } from "../utils/transaction-helpers"
import { TransactionPaymentBadge, TransactionStatusBadge } from "../table/transaction-status-badges"

function DetailRow({ label, value }: { readonly label: string; readonly value: string }): ReactElement {
  return <div className="flex items-start justify-between gap-4 py-1.5"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-64 text-right font-medium text-foreground">{value}</dd></div>
}

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
}: {
  readonly transaction: Transaction | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}): ReactElement {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Transaction Details</SheetTitle>
          <SheetDescription>{transaction ? `${transaction.id} · ${transaction.receiptNumber}` : "Select a transaction to review."}</SheetDescription>
        </SheetHeader>
        {transaction && (
          <ScrollArea className="min-h-0 flex-1 px-4 pb-6">
            <div className="space-y-6 pr-3">
              <section aria-labelledby="detail-transaction-info"><h3 id="detail-transaction-info" className="font-semibold text-foreground">Transaction information</h3><dl className="mt-2"><DetailRow label="Transaction ID" value={transaction.id} /><DetailRow label="Receipt" value={transaction.receiptNumber} /><DetailRow label="Created" value={formatDateTime(transaction.createdAt)} /><DetailRow label="Updated" value={formatDateTime(transaction.updatedAt)} /></dl><div className="mt-2 flex flex-wrap gap-2"><TransactionStatusBadge status={transaction.transactionStatus} /><TransactionPaymentBadge status={transaction.paymentStatus} /></div></section>
              <Separator />
              <section aria-labelledby="detail-customer"><h3 id="detail-customer" className="font-semibold text-foreground">Customer</h3><dl className="mt-2"><DetailRow label="Name" value={transaction.customer.name} /><DetailRow label="Email" value={transaction.customer.email} /><DetailRow label="Phone" value={transaction.customer.phone} /></dl></section>
              <Separator />
              <section aria-labelledby="detail-kiosk"><h3 id="detail-kiosk" className="font-semibold text-foreground">Kiosk</h3><dl className="mt-2"><DetailRow label="Kiosk" value={transaction.kiosk.name} /><DetailRow label="Kiosk ID" value={transaction.kiosk.id} /><DetailRow label="Location" value={transaction.kiosk.location} /></dl></section>
              <Separator />
              <section aria-labelledby="detail-order"><h3 id="detail-order" className="font-semibold text-foreground">Order details</h3><ul className="mt-2 divide-y divide-border">{transaction.items.map((item) => <li key={item.id} className="flex items-start justify-between gap-4 py-2"><div><p className="font-medium text-foreground">{item.name}</p><p className="text-xs text-muted-foreground">{item.category === "package" ? "Package" : "Add-on"} · Qty {item.quantity}</p></div><p className="font-medium tabular-nums">{formatRupiah(item.quantity * item.unitPrice)}</p></li>)}</ul><dl className="mt-2"><DetailRow label="Subtotal" value={formatRupiah(transaction.subtotal)} /><DetailRow label="Discount" value={`-${formatRupiah(transaction.discount)}`} /><DetailRow label="Tax" value={formatRupiah(transaction.tax)} /><DetailRow label="Total" value={formatRupiah(transaction.total)} /></dl></section>
              <Separator />
              <section aria-labelledby="detail-payment"><h3 id="detail-payment" className="font-semibold text-foreground">Payment information</h3><dl className="mt-2"><DetailRow label="Method" value={getPaymentMethodLabel(transaction.paymentMethod)} /><DetailRow label="Reference" value={transaction.paymentReference ?? "Not available"} /><DetailRow label="Paid date" value={transaction.paidAt ? formatDateTime(transaction.paidAt) : "Not paid"} /><DetailRow label="Amount paid" value={formatRupiah(transaction.paidAmount)} /></dl></section>
              <Separator />
              <section aria-labelledby="detail-refund"><h3 id="detail-refund" className="font-semibold text-foreground">Refund information</h3><dl className="mt-2"><DetailRow label="Refunded amount" value={formatRupiah(transaction.refundedAmount)} /><DetailRow label="Reason" value={transaction.refund ? getRefundReasonLabel(transaction.refund.reason) : "No refund"} /><DetailRow label="Refund date" value={transaction.refund ? formatDateTime(transaction.refund.refundedAt) : "Not available"} /><DetailRow label="Remaining refundable" value={formatRupiah(getRemainingRefundableAmount(transaction))} /></dl></section>
              <Separator />
              <section aria-labelledby="detail-activity"><h3 id="detail-activity" className="font-semibold text-foreground">Activity timeline</h3><ol className="mt-3 space-y-4">{transaction.activities.map((activity) => <li key={activity.id} className="flex gap-3"><Circle className="mt-1 size-3 shrink-0 fill-primary text-primary" aria-hidden="true" /><div><p className="font-medium text-foreground">{activity.title}</p><p className="text-sm text-muted-foreground">{activity.description}</p><time className="text-xs text-muted-foreground" dateTime={activity.occurredAt}>{formatDateTime(activity.occurredAt)}</time></div></li>)}</ol></section>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  )
}

