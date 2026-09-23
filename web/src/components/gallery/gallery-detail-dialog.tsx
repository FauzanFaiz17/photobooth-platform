import { Images } from "lucide-react";
import { type ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  GalleryRecord,
} from "@/features/galleries/gallery.types";
import { MediaTile } from "./components/media-tile";
import { useMediaUrls } from "./hooks/use-media-url";


export function GalleryDetailDialog({
  gallery,
  galleryToken,
  open,
  onOpenChange,
}: {
  readonly gallery: GalleryRecord;
  readonly galleryToken: string | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}): ReactElement {
  const { urls, loading, failed } = useMediaUrls(galleryToken, gallery.media);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {gallery.customer?.name || `Sesi #${gallery.id}`}
          </DialogTitle>
          <DialogDescription>
            {gallery.media.length} media dalam sesi ini. Berkas diambil dari
            server saat dialog dibuka.
          </DialogDescription>
        </DialogHeader>

        {gallery.media.length === 0 && (
          <div className="grid min-h-40 place-items-center text-center">
            <div>
              <Images
                className="mx-auto size-10 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Sesi ini belum memiliki media.
              </p>
            </div>
          </div>
        )}

        {failed && gallery.media.length > 0 && (
          <p role="alert" className="text-sm text-destructive">
            {galleryToken
              ? "Media tidak dapat dimuat dari server."
              : "Link gallery belum dibuat, media tidak bisa diambil."}
          </p>
        )}

        {gallery.media.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {loading
              ? gallery.media.map((item) => (
                  <Skeleton
                    key={item.id}
                    className="aspect-square rounded-md"
                  />
                ))
              : gallery.media.map((item) => (
                  <MediaTile
                    key={item.id}
                    media={item}
                    url={urls.get(item.id)}
                  />
                ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t pt-4 text-xs text-muted-foreground">
          <Badge variant="secondary">Sesi #{gallery.id}</Badge>
          {gallery.event_id && (
            <Badge variant="outline">Event #{gallery.event_id}</Badge>
          )}
          {gallery.booth_id && (
            <Badge variant="outline">Booth #{gallery.booth_id}</Badge>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
