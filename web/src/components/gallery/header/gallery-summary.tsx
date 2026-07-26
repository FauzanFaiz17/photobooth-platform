import { Database, FolderOpen, Images, ScanFace } from "lucide-react"
import type { ReactElement } from "react"

import { Card, CardContent } from "@/components/ui/card"
import type { GallerySummary } from "../types/gallery.types"
import { formatMediaCount } from "../utils/gallery-formatters"

export function GallerySummaryBar({ summary }: { readonly summary: GallerySummary }): ReactElement {
  const items = [
    { id: "media", label: "Total media", value: formatMediaCount(summary.totalMedia), icon: Images },
    { id: "sessions", label: "Photo sessions", value: formatMediaCount(summary.totalSessions), icon: ScanFace },
    { id: "albums", label: "Published galleries", value: formatMediaCount(summary.publishedAlbums), icon: FolderOpen },
    { id: "storage", label: "Storage usage", value: `${summary.storageUsedGb} GB / ${summary.storageTotalGb} GB`, icon: Database },
  ] as const

  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardContent className="grid p-0 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 border-b border-border p-4 sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(n+3)]:border-b-0 xl:border-r xl:border-b-0 xl:last:border-r-0">
            <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
            <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-0.5 font-semibold text-foreground tabular-nums">{item.value}</p></div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
