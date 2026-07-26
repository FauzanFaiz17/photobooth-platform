import { Badge } from "@/components/ui/badge"

import type { StatusMeta } from "../types/kiosk.types"

interface KioskStatusBadgeProps {
  readonly meta: StatusMeta
}

export function KioskStatusBadge({ meta }: KioskStatusBadgeProps): ReactElement {
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}
import type { ReactElement } from "react"
