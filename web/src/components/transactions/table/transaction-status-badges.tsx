import { Ban, CheckCircle2, CircleDollarSign, Clock3, RotateCcw, TriangleAlert, WalletCards, type LucideIcon } from "lucide-react"
import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import type { PaymentStatus, TransactionStatus } from "../types/transaction.types"
import { getPaymentStatusLabel, getTransactionStatusLabel } from "../utils/transaction-formatters"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

function assertNever(value: never): never {
  throw new Error(`Unhandled badge status: ${String(value)}`)
}

function getTransactionStatusMeta(status: TransactionStatus): { readonly icon: LucideIcon; readonly variant: BadgeVariant } {
  switch (status) {
    case "completed": return { icon: CheckCircle2, variant: "default" }
    case "processing": return { icon: Clock3, variant: "secondary" }
    case "cancelled": return { icon: Ban, variant: "outline" }
    case "refunded": return { icon: RotateCcw, variant: "secondary" }
    case "failed": return { icon: TriangleAlert, variant: "destructive" }
    default: return assertNever(status)
  }
}

function getPaymentStatusMeta(status: PaymentStatus): { readonly icon: LucideIcon; readonly variant: BadgeVariant } {
  switch (status) {
    case "paid": return { icon: CircleDollarSign, variant: "default" }
    case "pending": return { icon: Clock3, variant: "secondary" }
    case "partially_refunded": return { icon: RotateCcw, variant: "outline" }
    case "refunded": return { icon: RotateCcw, variant: "secondary" }
    case "failed": return { icon: WalletCards, variant: "destructive" }
    default: return assertNever(status)
  }
}

export function TransactionStatusBadge({ status }: { readonly status: TransactionStatus }): ReactElement {
  const meta = getTransactionStatusMeta(status)
  const Icon = meta.icon
  return <Badge variant={meta.variant}><Icon aria-hidden="true" />{getTransactionStatusLabel(status)}</Badge>
}

export function TransactionPaymentBadge({ status }: { readonly status: PaymentStatus }): ReactElement {
  const meta = getPaymentStatusMeta(status)
  const Icon = meta.icon
  return <Badge variant={meta.variant}><Icon aria-hidden="true" />{getPaymentStatusLabel(status)}</Badge>
}

