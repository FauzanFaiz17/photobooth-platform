import { Badge } from "@/components/ui/badge"
import type { UserStatus } from "@/features/users/user.types"

const statusMeta = {
  active: {
    label: "Active",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  suspended: {
    label: "Suspended",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive",
  },
  invited: {
    label: "Invited",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
  },
  inactive: {
    label: "Inactive",
    className: "border-border bg-muted text-muted-foreground",
  },
} satisfies Record<
  UserStatus,
  {
    readonly label: string
    readonly className: string
  }
>

export function UserStatusBadge({ status }: { readonly status: UserStatus }) {
  const meta = statusMeta[status]

  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}
