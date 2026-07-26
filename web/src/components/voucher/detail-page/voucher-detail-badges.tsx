import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import type {
  KioskVoucherStatus,
  KioskVoucherType,
} from "../catalog/voucher-catalog.types"
import { voucherTypeLabels } from "../catalog/voucher-catalog.utils"

const statusMeta: Record<
  KioskVoucherStatus,
  { readonly label: string; readonly variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  unused: { label: "Belum Terpakai", variant: "default" },
  used: { label: "Sudah Terpakai", variant: "secondary" },
  expired: { label: "Kedaluwarsa", variant: "destructive" },
  inactive: { label: "Nonaktif", variant: "outline" },
}

export function VoucherStatusBadge({
  status,
}: {
  readonly status: KioskVoucherStatus
}): ReactElement {
  const meta = statusMeta[status]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

export function VoucherTypeBadge({
  type,
}: {
  readonly type: KioskVoucherType
}): ReactElement {
  return <Badge variant="outline">{voucherTypeLabels[type]}</Badge>
}
