import { Grid2X2, List } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { GalleryViewMode } from "../types/gallery.types"

export function GalleryViewSwitcher({ view, onChange }: { readonly view: GalleryViewMode; readonly onChange: (view: GalleryViewMode) => void }): ReactElement {
  return (
    <div className="flex items-center gap-1" aria-label="Gallery view mode">
      <Tooltip><TooltipTrigger render={<Button variant={view === "grid" ? "secondary" : "ghost"} size="icon-sm" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => onChange("grid")} />}><Grid2X2 aria-hidden="true" /></TooltipTrigger><TooltipContent>Grid view</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger render={<Button variant={view === "list" ? "secondary" : "ghost"} size="icon-sm" aria-label="List view" aria-pressed={view === "list"} onClick={() => onChange("list")} />}><List aria-hidden="true" /></TooltipTrigger><TooltipContent>List view</TooltipContent></Tooltip>
    </div>
  )
}
