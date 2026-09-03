import { CircleAlert, Download, FileVideo, Images } from "lucide-react"
import { useEffect, useState, type ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchGalleryMediaUrl } from "@/features/galleries/gallery-service"
import type { GalleryMedia, GalleryRecord } from "@/features/galleries/gallery.types"

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Setiap pengambilan media menaikkan download_count di backend, jadi berkas hanya
 * diambil saat dialog benar-benar dibuka — bukan ikut ter-load bersama daftar kartu.
 */
function useMediaUrls(token: string | null, media: ReadonlyArray<GalleryMedia>): {
  urls: ReadonlyMap<number, string>
  loading: boolean
  failed: boolean
} {
  const [urls, setUrls] = useState<ReadonlyMap<number, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const created: string[] = []

    async function load() {
      const entries = await Promise.all(
        media.map(async (item) => {
          try {
            const url = await fetchGalleryMediaUrl(token as string, item.id, controller.signal)
            created.push(url)
            return [item.id, url] as const
          } catch {
            return null
          }
        })
      )

      if (controller.signal.aborted) return
      const resolved = entries.filter((entry): entry is readonly [number, string] => entry !== null)
      setUrls(new Map(resolved))
      setFailed(resolved.length === 0 && media.length > 0)
      setLoading(false)
    }

    void load()

    return () => {
      controller.abort()
      for (const url of created) URL.revokeObjectURL(url)
    }
  }, [media, token])

  // Tanpa token media tidak bisa diambil sama sekali, jadi statusnya turunan, bukan efek.
  if (!token) return { urls, loading: false, failed: media.length > 0 }

  return { urls, loading, failed }
}

function MediaTile({ media, url }: { readonly media: GalleryMedia; readonly url: string | undefined }): ReactElement {
  const isVideo = media.mime_type.startsWith("video/")

  return (
    <figure className="overflow-hidden rounded-md border">
      <div className="relative aspect-square bg-muted/40">
        {url && !isVideo && <img src={url} alt={media.filename} className="absolute inset-0 size-full object-contain p-1" />}
        {url && isVideo && <video src={url} controls className="absolute inset-0 size-full object-contain" />}
        {!url && (
          <div className="absolute inset-0 grid place-items-center">
            {isVideo ? <FileVideo className="size-8 text-muted-foreground" aria-hidden="true" /> : <CircleAlert className="size-8 text-muted-foreground" aria-hidden="true" />}
          </div>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-2 border-t px-2 py-1.5">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium" title={media.filename}>{media.filename}</span>
          <span className="block text-[11px] text-muted-foreground">{media.type} · {formatSize(media.size_bytes)}</span>
        </span>
        {url && (
          <Button size="icon" variant="ghost" className="size-7 shrink-0" render={<a href={url} download={media.filename} aria-label={`Unduh ${media.filename}`} />}>
            <Download aria-hidden="true" />
          </Button>
        )}
      </figcaption>
    </figure>
  )
}

export function GalleryDetailDialog({
  gallery,
  galleryToken,
  open,
  onOpenChange,
}: {
  readonly gallery: GalleryRecord
  readonly galleryToken: string | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}): ReactElement {
  const { urls, loading, failed } = useMediaUrls(galleryToken, gallery.media)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{gallery.customer?.name || `Sesi #${gallery.id}`}</DialogTitle>
          <DialogDescription>
            {gallery.media.length} media dalam sesi ini. Berkas diambil dari server saat dialog dibuka.
          </DialogDescription>
        </DialogHeader>

        {gallery.media.length === 0 && (
          <div className="grid min-h-40 place-items-center text-center">
            <div>
              <Images className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">Sesi ini belum memiliki media.</p>
            </div>
          </div>
        )}

        {failed && gallery.media.length > 0 && (
          <p role="alert" className="text-sm text-destructive">
            {galleryToken ? "Media tidak dapat dimuat dari server." : "Link gallery belum dibuat, media tidak bisa diambil."}
          </p>
        )}

        {gallery.media.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {loading
              ? gallery.media.map((item) => <Skeleton key={item.id} className="aspect-square rounded-md" />)
              : gallery.media.map((item) => <MediaTile key={item.id} media={item} url={urls.get(item.id)} />)}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t pt-4 text-xs text-muted-foreground">
          <Badge variant="secondary">Sesi #{gallery.id}</Badge>
          {gallery.event_id && <Badge variant="outline">Event #{gallery.event_id}</Badge>}
          {gallery.booth_id && <Badge variant="outline">Booth #{gallery.booth_id}</Badge>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
