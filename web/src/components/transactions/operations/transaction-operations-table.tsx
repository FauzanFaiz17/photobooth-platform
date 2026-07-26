import { Eye } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PhotoboothTransaction } from "./transaction-operations.types"
import {
  formatTransactionCurrency,
  formatTransactionDateTime,
  paymentMethodLabels,
} from "./transaction-operations.utils"
import {
  PhotoboothSessionModeBadge,
  PhotoboothTransactionStatusBadge,
} from "./transaction-operations-badges"

export function TransactionOperationsTable({
  transactions,
  onViewDetail,
}: {
  readonly transactions: ReadonlyArray<PhotoboothTransaction>
  readonly onViewDetail: (transaction: PhotoboothTransaction) => void
}): ReactElement {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID Transaksi</TableHead>
          <TableHead>Tanggal dan Waktu</TableHead>
          <TableHead>Nama Kiosk</TableHead>
          <TableHead>ID Sesi</TableHead>
          <TableHead>Mode Sesi</TableHead>
          <TableHead>Metode Pembayaran</TableHead>
          <TableHead className="text-right">Nominal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-mono text-xs font-medium">{transaction.id}</TableCell>
            <TableCell>
              <time dateTime={transaction.occurredAt} className="whitespace-nowrap">
                {formatTransactionDateTime(transaction.occurredAt)}
              </time>
            </TableCell>
            <TableCell className="font-medium">{transaction.kiosk.name}</TableCell>
            <TableCell className="font-mono text-xs">{transaction.sessionId}</TableCell>
            <TableCell><PhotoboothSessionModeBadge mode={transaction.sessionMode} /></TableCell>
            <TableCell>{paymentMethodLabels[transaction.paymentMethod]}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatTransactionCurrency(transaction.amount)}
            </TableCell>
            <TableCell><PhotoboothTransactionStatusBadge status={transaction.status} /></TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" onClick={() => onViewDetail(transaction)}>
                <Eye aria-hidden="true" />
                Lihat Detail
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
