import { Archive, Images, ScanFace, Sparkles } from "lucide-react"
import type { ReactElement } from "react"

import { Card, CardContent } from "@/components/ui/card"
import type { PhotoFrameSummary } from "../types/frame-photo.types"
import { formatFrameUsage } from "../utils/frame-photo-utils"

export function FramePhotoSummaryCards({ summary }: { readonly summary: PhotoFrameSummary }): ReactElement {
  const metrics = [
    { id: "total", label: "Total Frames", value: formatFrameUsage(summary.totalFrames), supporting: "Across all categories", icon: Images },
    { id: "active", label: "Active Frames", value: formatFrameUsage(summary.activeFrames), supporting: "Available on kiosks", icon: Sparkles },
    { id: "draft", label: "Draft Frames", value: formatFrameUsage(summary.draftFrames), supporting: "Awaiting publication", icon: Archive },
    { id: "usage", label: "Total Usage", value: formatFrameUsage(summary.totalUsage), supporting: "sessions recorded", icon: ScanFace },
  ] as const
  return <section aria-labelledby="frame-summary-heading"><h2 id="frame-summary-heading" className="sr-only">Frame library summary</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => { const Icon = metric.icon; return <Card key={metric.id} className="shadow-none"><CardContent><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-muted-foreground">{metric.label}</p><p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{metric.value}</p></div><div className="flex size-9 items-center justify-center rounded-lg bg-muted"><Icon className="size-4 text-foreground" aria-hidden="true" /></div></div><p className="mt-4 text-xs text-muted-foreground">{metric.supporting}</p></CardContent></Card>})}</div></section>
}

