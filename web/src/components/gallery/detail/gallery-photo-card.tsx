import { CalendarDays, Ticket } from "lucide-react"
import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type {
  GalleryApprovalStatus,
  GalleryCaptureItem,
} from "../catalog/gallery-catalog.types"
import { formatGalleryDateTime } from "../catalog/gallery-catalog-utils"

const approvalMeta: Record<
  GalleryApprovalStatus,
  { readonly label: string; readonly variant: "default" | "secondary" | "destructive" }
> = {
  approved: { label: "Disetujui", variant: "default" },
  pending: { label: "Menunggu", variant: "secondary" },
  rejected: { label: "Ditolak", variant: "destructive" },
}

export function GalleryPhotoCard({
  photo,
}: {
  readonly photo: GalleryCaptureItem
}): ReactElement {
  const status = approvalMeta[photo.approvalStatus]

  return (
    <Card className="gap-0 py-0 shadow-none">
      <img
        src={photo.thumbnailPath}
        alt={`Foto yang diambil pada ${formatGalleryDateTime(photo.capturedAt)}`}
        className="aspect-[4/3] w-full object-cover"
        loading="lazy"
      />
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2 text-sm">
            <CalendarDays className="mt-0.5 size-4 shrink-0 opacity-60" aria-hidden="true" />
            <time dateTime={photo.capturedAt} className="leading-snug">
              {formatGalleryDateTime(photo.capturedAt)}
            </time>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm opacity-70">
          <Ticket className="size-4 shrink-0" aria-hidden="true" />
          <span>{photo.voucherCode ? `Voucher: ${photo.voucherCode}` : "Tanpa voucher"}</span>
        </div>
      </CardContent>
    </Card>
  )
}
