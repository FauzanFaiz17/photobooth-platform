import { Monitor, ScanFace } from "lucide-react"
import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { PhotoFrame } from "../types/frame-photo.types"
import { getCategoryIcon, getOrientationIcon } from "../utils/frame-photo-meta"
import { formatFrameDate, formatFrameUsage, getCategoryLabel, getLayoutLabel, getOrientationLabel } from "../utils/frame-photo-utils"
import { FramePhotoActionMenu, type FramePhotoActions } from "./frame-photo-actions"
import { FramePhotoStatusBadge } from "./frame-photo-status-badge"
import { FramePhotoVisual } from "./frame-photo-visual"

export function FramePhotoGrid({ frames, selectedIds, onSelectionChange, actions }: { readonly frames: ReadonlyArray<PhotoFrame>; readonly selectedIds: ReadonlySet<string>; readonly onSelectionChange: (id: string, selected: boolean) => void; readonly actions: FramePhotoActions }): ReactElement {
  return <ul className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{frames.map((frame) => { const CategoryIcon = getCategoryIcon(frame.category); const OrientationIcon = getOrientationIcon(frame.orientation); return <li key={frame.id}><Card className="gap-0 py-0 shadow-none"><div className="relative border-b border-border"><FramePhotoVisual frame={frame} compact /><div className="absolute top-2 left-2"><Checkbox checked={selectedIds.has(frame.id)} onCheckedChange={(checked) => onSelectionChange(frame.id, checked)} aria-label={`Select ${frame.name}`} className="bg-background" /></div><div className="absolute top-2 right-2"><FramePhotoStatusBadge status={frame.status} /></div></div><CardContent className="p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate font-semibold text-foreground" title={frame.name}>{frame.name}</h3><p className="font-mono text-xs text-muted-foreground">{frame.code}</p></div><FramePhotoActionMenu frame={frame} actions={actions} /></div><div className="mt-3 flex flex-wrap gap-1.5"><Badge variant="outline"><CategoryIcon aria-hidden="true" />{getCategoryLabel(frame.category)}</Badge><Badge variant="secondary"><OrientationIcon aria-hidden="true" />{getOrientationLabel(frame.orientation)} · {frame.aspectRatio}</Badge></div><p className="mt-3 text-xs text-muted-foreground">{getLayoutLabel(frame.layout)} · {frame.photoSlotCount} photo slots</p><div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><ScanFace className="size-3.5" aria-hidden="true" />{formatFrameUsage(frame.usageCount)} uses</span><span className="inline-flex items-center justify-end gap-1"><Monitor className="size-3.5" aria-hidden="true" />{frame.assignments.length} kiosks</span><span className="col-span-2">Updated <time dateTime={frame.updatedAt}>{formatFrameDate(frame.updatedAt)}</time></span></div></CardContent></Card></li> })}</ul>
}
