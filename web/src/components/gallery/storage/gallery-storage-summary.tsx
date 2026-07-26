import { Database } from "lucide-react"
import type { ReactElement } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { GalleryStorageSummary as StorageData } from "../types/gallery.types"
import { calculateStoragePercentage, formatFileSize, formatMediaCount } from "../utils/gallery-formatters"
import { mediaTypeMeta } from "../utils/gallery-status-mapper"

export function GalleryStorageSummary({ storage }: { readonly storage: StorageData }): ReactElement {
  const percentage = calculateStoragePercentage(storage.usedBytes, storage.totalBytes)
  const remainingMedia = Math.floor((storage.availableBytes / storage.usedBytes) * storage.mediaCount)
  return (
    <Card className="shadow-sm">
      <CardHeader><CardTitle><h2>Gallery storage</h2></CardTitle><CardDescription>Capacity used by original media and previews.</CardDescription></CardHeader>
      <CardContent>
        <div className="flex items-end justify-between"><div><p className="text-3xl font-semibold text-foreground tabular-nums">{percentage}%</p><p className="text-sm text-muted-foreground">used</p></div><Database className="size-6 text-muted-foreground" aria-hidden="true" /></div>
        <Progress value={percentage} className="mt-4" aria-label={`${percentage}% gallery storage used`} />
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-muted-foreground">Used / total</dt><dd className="mt-1 font-medium text-foreground">{formatFileSize(storage.usedBytes)} / {formatFileSize(storage.totalBytes)}</dd></div>
          <div><dt className="text-muted-foreground">Available</dt><dd className="mt-1 font-medium text-foreground">{formatFileSize(storage.availableBytes)}</dd></div>
          <div><dt className="text-muted-foreground">Largest type</dt><dd className="mt-1 font-medium text-foreground">{mediaTypeMeta[storage.largestMediaType].label}</dd></div>
          <div><dt className="text-muted-foreground">Estimated capacity</dt><dd className="mt-1 font-medium text-foreground">~{formatMediaCount(remainingMedia)} media</dd></div>
        </dl>
      </CardContent>
    </Card>
  )
}
