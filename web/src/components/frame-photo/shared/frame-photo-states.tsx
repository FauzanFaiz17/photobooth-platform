import { CircleAlert, Images } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function FramePhotoEmptyState({ filtered, onReset, onCreate }: { readonly filtered: boolean; readonly onReset: () => void; readonly onCreate: () => void }): ReactElement {
  return <div className="flex min-h-72 flex-col items-center justify-center border-y border-border px-6 text-center"><Images className="size-9 text-muted-foreground" aria-hidden="true" /><h3 className="mt-3 font-medium text-foreground">{filtered ? "No frames found" : "Create your first photo frame"}</h3><p className="mt-1 max-w-md text-sm text-muted-foreground">{filtered ? "Try adjusting your search or filters." : "Upload or design a frame that can be assigned to your photo kiosks."}</p><Button className="mt-4" variant={filtered ? "outline" : "default"} onClick={filtered ? onReset : onCreate}>{filtered ? "Reset Filters" : "Create Frame"}</Button></div>
}

export function FramePhotoErrorState({ onRetry }: { readonly onRetry: () => void }): ReactElement {
  return <div className="flex min-h-72 flex-col items-center justify-center border-y border-border px-6 text-center"><CircleAlert className="size-9 text-destructive" aria-hidden="true" /><h3 className="mt-3 font-medium text-foreground">Frame library unavailable</h3><p className="mt-1 text-sm text-muted-foreground">The frame collection could not be prepared.</p><Button className="mt-4" variant="outline" onClick={onRetry}>Retry</Button></div>
}

export function FramePhotoSkeleton(): ReactElement {
  return <div className="min-w-0 space-y-7 p-4 sm:p-6 lg:p-8" aria-label="Loading Frame Photo"><div className="space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-full max-w-xl" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={`frame-summary-${index + 1}`} className="h-32" />)}</div><Skeleton className="h-24 w-full" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={`frame-card-${index + 1}`} className="h-96" />)}</div></div>
}

