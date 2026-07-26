import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import type {
  PhotoboothSessionMode,
  PhotoboothTransactionStatus,
} from "./transaction-operations.types"
import { sessionModeLabels } from "./transaction-operations.utils"

const statusMeta: Record<
  PhotoboothTransactionStatus,
  { readonly label: string; readonly variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  success: { label: "Berhasil", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  failed: { label: "Gagal", variant: "destructive" },
  expired: { label: "Kedaluwarsa", variant: "outline" },
  voucher: { label: "Voucher", variant: "default" },
  free: { label: "Gratis", variant: "secondary" },
}

export function PhotoboothTransactionStatusBadge({
  status,
}: {
  readonly status: PhotoboothTransactionStatus
}): ReactElement {
  const meta = statusMeta[status]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

export function PhotoboothSessionModeBadge({
  mode,
}: {
  readonly mode: PhotoboothSessionMode
}): ReactElement {
  return <Badge variant="outline">{sessionModeLabels[mode]}</Badge>
}
