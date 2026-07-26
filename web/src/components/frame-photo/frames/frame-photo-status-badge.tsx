import { Archive, CircleCheck, CircleDashed } from "lucide-react"
import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import type { PhotoFrameStatus } from "../types/frame-photo.types"
import { getStatusLabel } from "../utils/frame-photo-utils"

function assertNever(value: never): never { throw new Error(`Unhandled frame metadata: ${String(value)}`) }

export function FramePhotoStatusBadge({ status }: { readonly status: PhotoFrameStatus }): ReactElement {
  switch (status) {
    case "active": return <Badge variant="default"><CircleCheck aria-hidden="true" />{getStatusLabel(status)}</Badge>
    case "draft": return <Badge variant="secondary"><CircleDashed aria-hidden="true" />{getStatusLabel(status)}</Badge>
    case "archived": return <Badge variant="outline"><Archive aria-hidden="true" />{getStatusLabel(status)}</Badge>
    default: return assertNever(status)
  }
}
