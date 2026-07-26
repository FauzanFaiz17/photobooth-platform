import { Badge } from "@/components/ui/badge"
import type { VoucherEffectiveStatus } from "../types/voucher.types"
import { getVoucherStatusLabel } from "../utils/voucher-utils"

interface VoucherStatusBadgeProps { readonly status: VoucherEffectiveStatus }

export function VoucherStatusBadge({ status }: VoucherStatusBadgeProps) {
  const variant = status === "active" ? "default" : status === "expired" || status === "disabled" ? "destructive" : status === "scheduled" ? "outline" : "secondary"
  return <Badge variant={variant}>{getVoucherStatusLabel(status)}</Badge>
}
