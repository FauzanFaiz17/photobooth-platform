import type { ReactElement } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { PhotoboothTransaction } from "./transaction-operations.types"
import {
  formatTransactionCurrency,
  formatTransactionDateTime,
  paymentMethodLabels,
  sessionModeLabels,
} from "./transaction-operations.utils"
import { PhotoboothTransactionStatusBadge } from "./transaction-operations-badges"

function DetailRow({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="opacity-60">{label}</dt>
      <dd className="max-w-72 text-right font-medium">{value}</dd>
    </div>
  )
}

export function TransactionOperationsDetail({
  transaction,
  open,
  onOpenChange,
}: {
  readonly transaction: PhotoboothTransaction | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detail Transaksi</DialogTitle>
          <DialogDescription>
            {transaction ? `${transaction.id} · ${transaction.kiosk.name}` : "Pilih transaksi untuk melihat detail."}
          </DialogDescription>
        </DialogHeader>
        {transaction && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-sm">{transaction.id}</p>
              <PhotoboothTransactionStatusBadge status={transaction.status} />
            </div>
            <Separator />
            <dl>
              <DetailRow label="Session ID" value={transaction.sessionId} />
              <DetailRow label="Kiosk" value={transaction.kiosk.name} />
              <DetailRow label="Mode sesi" value={sessionModeLabels[transaction.sessionMode]} />
              <DetailRow label="Metode pembayaran" value={paymentMethodLabels[transaction.paymentMethod]} />
              <DetailRow label="Payment reference" value={transaction.paymentReference ?? "Tidak tersedia"} />
              <DetailRow label="Payment gateway" value={transaction.paymentGateway ?? "Tidak tersedia"} />
              <DetailRow label="Voucher" value={transaction.voucherCode ?? "Tidak digunakan"} />
              <DetailRow label="Nominal" value={formatTransactionCurrency(transaction.amount)} />
              <DetailRow label="Waktu transaksi" value={formatTransactionDateTime(transaction.occurredAt)} />
            </dl>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
