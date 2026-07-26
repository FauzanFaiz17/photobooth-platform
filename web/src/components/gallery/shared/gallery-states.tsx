import { Images, SearchX, TriangleAlert } from "lucide-react"
import type { ReactElement } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

export function GalleryLoadingState(): ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading Gallery">
      {["one", "two", "three", "four"].map((id) => (
        <Skeleton key={id} className="aspect-[4/3] w-full" />
      ))}
    </div>
  )
}

export function GalleryEmptyState({ filtered }: { readonly filtered: boolean }): ReactElement {
  const Icon = filtered ? SearchX : Images
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border-y border-border px-6 text-center">
      <Icon className="size-9 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-foreground">
        {filtered ? "No matching media" : "Gallery masih kosong"}
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {filtered
          ? "Ubah search atau clear filter untuk melihat media lain."
          : "Media dari sesi photobooth akan tampil di sini."}
      </p>
    </div>
  )
}

export function GalleryErrorState(): ReactElement {
  return (
    <Alert variant="destructive">
      <TriangleAlert aria-hidden="true" />
      <AlertTitle>Gallery unavailable</AlertTitle>
      <AlertDescription>Media tidak dapat ditampilkan. Coba muat ulang halaman.</AlertDescription>
    </Alert>
  )
}
