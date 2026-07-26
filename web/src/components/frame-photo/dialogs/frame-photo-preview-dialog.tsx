import { Copy, Edit3 } from "lucide-react"
import { useState, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { PhotoFrame, PhotoFramePreviewMode } from "../types/frame-photo.types"
import { formatFrameDate, formatFrameUsage, getCategoryLabel, getLayoutLabel, getOrientationLabel } from "../utils/frame-photo-utils"
import { FramePhotoStatusBadge } from "../frames/frame-photo-status-badge"
import { FramePhotoVisual } from "../frames/frame-photo-visual"

function PreviewDetail({ label, value }: { readonly label: string; readonly value: string }): ReactElement {
  return <div className="flex items-start justify-between gap-4 py-1.5"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium text-foreground">{value}</dd></div>
}

export function FramePhotoPreviewDialog({ frame, open, onOpenChange, onEdit, onDuplicate }: { readonly frame: PhotoFrame | null; readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onEdit: (frame: PhotoFrame) => void; readonly onDuplicate: (frame: PhotoFrame) => void }): ReactElement {
  const [mode, setMode] = useState<PhotoFramePreviewMode>("sample")
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>{frame?.name ?? "Frame Preview"}</DialogTitle><DialogDescription>{frame ? `${frame.code} · ${getCategoryLabel(frame.category)}` : "Select a frame to preview."}</DialogDescription></DialogHeader>{frame && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]"><div className="space-y-3"><div className="mx-auto w-full max-w-lg overflow-hidden rounded-lg border border-border"><FramePhotoVisual frame={frame} mode={mode} /></div><div className="flex justify-center gap-2"><Button variant={mode === "sample" ? "secondary" : "outline"} size="sm" aria-pressed={mode === "sample"} onClick={() => setMode("sample")}>With sample photos</Button><Button variant={mode === "frame-only" ? "secondary" : "outline"} size="sm" aria-pressed={mode === "frame-only"} onClick={() => setMode("frame-only")}>Frame only</Button></div></div><div><div className="flex flex-wrap gap-2"><FramePhotoStatusBadge status={frame.status} /></div><Separator className="my-4" /><dl><PreviewDetail label="Category" value={getCategoryLabel(frame.category)} /><PreviewDetail label="Layout" value={getLayoutLabel(frame.layout)} /><PreviewDetail label="Orientation" value={getOrientationLabel(frame.orientation)} /><PreviewDetail label="Dimensions" value={`${frame.dimensions.width} × ${frame.dimensions.height} ${frame.dimensions.unit}`} /><PreviewDetail label="Aspect ratio" value={frame.aspectRatio} /><PreviewDetail label="Photo slots" value={String(frame.photoSlotCount)} /><PreviewDetail label="Assigned kiosks" value={String(frame.assignments.length)} /><PreviewDetail label="Usage" value={`${formatFrameUsage(frame.usageCount)} sessions`} /><PreviewDetail label="Created" value={formatFrameDate(frame.createdAt)} /><PreviewDetail label="Updated" value={formatFrameDate(frame.updatedAt)} /></dl></div></div>}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>{frame && <><Button variant="outline" onClick={() => onDuplicate(frame)}><Copy aria-hidden="true" /> Duplicate</Button><Button onClick={() => onEdit(frame)}><Edit3 aria-hidden="true" /> Edit Frame</Button></>}</DialogFooter></DialogContent></Dialog>
}

