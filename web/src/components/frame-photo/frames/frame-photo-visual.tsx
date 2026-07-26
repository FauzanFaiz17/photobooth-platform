import { Camera } from "lucide-react"
import type { ReactElement } from "react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import type { PhotoFrame, PhotoFrameLayout, PhotoFramePreviewMode } from "../types/frame-photo.types"
import { getPreviewAspectRatio } from "../utils/frame-photo-utils"

function getLayoutClass(layout: PhotoFrameLayout): string {
  switch (layout) {
    case "single_photo": return "grid-cols-1"
    case "vertical_strip": return "grid-cols-1"
    case "horizontal_strip": return "grid-cols-3"
    case "two_photo": return "grid-cols-2"
    case "three_photo": return "grid-cols-1"
    case "four_photo_grid": return "grid-cols-2"
    case "postcard": return "grid-cols-1"
    case "custom": return "grid-cols-2"
  }
}

export function FramePhotoVisual({ frame, mode = "sample", compact = false }: { readonly frame: PhotoFrame; readonly mode?: PhotoFramePreviewMode; readonly compact?: boolean }): ReactElement {
  const visibleSlots = Math.min(frame.photoSlotCount, 4)
  return (
    <AspectRatio ratio={getPreviewAspectRatio(frame)} className="overflow-hidden bg-muted">
      <div role="img" aria-label={`${frame.name} photobooth frame preview`} className="flex size-full flex-col border border-border bg-card p-2">
        <div className={`grid min-h-0 flex-1 gap-1.5 ${getLayoutClass(frame.layout)}`}>
          {Array.from({ length: visibleSlots }, (_, slot) => (
            <div key={`${frame.id}-slot-${slot + 1}`} className="flex min-h-0 items-center justify-center border border-border bg-muted">
              {mode === "sample" ? <Camera className={compact ? "size-4 text-muted-foreground" : "size-6 text-muted-foreground"} aria-hidden="true" /> : <span className="text-xs text-muted-foreground">Slot {slot + 1}</span>}
            </div>
          ))}
        </div>
        <div className={compact ? "pt-1 text-center" : "pt-2 text-center"}><p className={compact ? "truncate text-[10px] font-medium text-foreground" : "truncate text-xs font-semibold text-foreground"}>{frame.category === "corporate" ? "PHOTOLAB STUDIO" : "YOUR MOMENT"}</p>{!compact && <p className="text-[10px] text-muted-foreground">15 · 07 · 2026</p>}</div>
      </div>
    </AspectRatio>
  )
}

