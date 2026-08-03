import { Badge } from "@/components/ui/badge"
import type { PartnerStatus } from "@/features/partners/partner.types"

const statusMeta = {
  active: {
    label: "Active",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  suspended: {
    label: "Suspended",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  trial: {
    label: "Trial",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  },
  inactive: {
    label: "Inactive",
    className: "border-border bg-muted text-muted-foreground",
  },
} satisfies Record<
  PartnerStatus,
  {
    readonly label: string
    readonly className: string
  }
>

export function PartnerStatusBadge({
  status,
}: {
  readonly status: PartnerStatus
}) {
  const meta = statusMeta[status]

  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}
