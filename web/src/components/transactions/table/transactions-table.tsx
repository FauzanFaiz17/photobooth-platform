import { Ban, CheckCircle2, Copy, Ellipsis, Eye, ReceiptText, RotateCcw } from "lucide-react"
import type { ReactElement } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Transaction } from "../types/transaction.types"
import { formatDate, formatRupiah, formatTime, getCustomerInitials, getPaymentMethodLabel } from "../utils/transaction-formatters"
import { getRemainingRefundableAmount } from "../utils/transaction-helpers"
import { TransactionPaymentBadge, TransactionStatusBadge } from "./transaction-status-badges"

export interface TransactionRowActions {
  readonly onViewDetails: (transaction: Transaction) => void
  readonly onViewReceipt: (transaction: Transaction) => void
  readonly onCopyId: (transaction: Transaction) => void
  readonly onMarkCompleted: (transaction: Transaction) => void
  readonly onRefund: (transaction: Transaction) => void
  readonly onCancel: (transaction: Transaction) => void
}

export function TransactionsTable({
  transactions,
  actions,
}: {
  readonly transactions: ReadonlyArray<Transaction>
  readonly actions: TransactionRowActions
}): ReactElement {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Transaction</TableHead><TableHead>Customer</TableHead><TableHead>Kiosk</TableHead><TableHead>Date</TableHead><TableHead>Payment Method</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Payment Status</TableHead><TableHead>Transaction Status</TableHead><TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          const canComplete = transaction.transactionStatus === "processing"
          const canRefund = (transaction.paymentStatus === "paid" || transaction.paymentStatus === "partially_refunded") && getRemainingRefundableAmount(transaction) > 0
          const canCancel = transaction.paymentStatus === "pending" || transaction.transactionStatus === "processing"

          return (
            <TableRow key={transaction.id}>
              <TableCell><p className="font-medium text-foreground">{transaction.id}</p><p className="text-xs text-muted-foreground">{transaction.receiptNumber}</p></TableCell>
              <TableCell><div className="flex items-center gap-2"><Avatar size="sm"><AvatarFallback>{getCustomerInitials(transaction.customer.name)}</AvatarFallback></Avatar><div><p className="font-medium text-foreground">{transaction.customer.name}</p><p className="max-w-48 truncate text-xs text-muted-foreground" title={transaction.customer.email}>{transaction.customer.email}</p></div></div></TableCell>
              <TableCell><p>{transaction.kiosk.name}</p><p className="text-xs text-muted-foreground">{transaction.kiosk.location}</p></TableCell>
              <TableCell><time dateTime={transaction.createdAt}><span className="block">{formatDate(transaction.createdAt)}</span><span className="block text-xs text-muted-foreground">{formatTime(transaction.createdAt)}</span></time></TableCell>
              <TableCell>{getPaymentMethodLabel(transaction.paymentMethod)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatRupiah(transaction.total)}</TableCell>
              <TableCell><TransactionPaymentBadge status={transaction.paymentStatus} /></TableCell>
              <TableCell><TransactionStatusBadge status={transaction.transactionStatus} /></TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${transaction.id}`} />}><Ellipsis aria-hidden="true" /></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => actions.onViewDetails(transaction)}><Eye aria-hidden="true" /> View Details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => actions.onViewReceipt(transaction)}><ReceiptText aria-hidden="true" /> View Receipt</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => actions.onCopyId(transaction)}><Copy aria-hidden="true" /> Copy Transaction ID</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={!canComplete} onClick={() => actions.onMarkCompleted(transaction)}><CheckCircle2 aria-hidden="true" /> Mark as Completed</DropdownMenuItem>
                    <DropdownMenuItem disabled={!canRefund} onClick={() => actions.onRefund(transaction)}><RotateCcw aria-hidden="true" /> Refund Transaction</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" disabled={!canCancel} onClick={() => actions.onCancel(transaction)}><Ban aria-hidden="true" /> Cancel Transaction</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

