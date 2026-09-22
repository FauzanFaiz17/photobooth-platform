import { Button } from "@/components/ui/button";
import type { GalleryMedia } from "@/features/galleries/gallery.types";
import { CircleAlert, Download, FileVideo } from "lucide-react";
import type { ReactElement } from "react";
import { formatSize } from "../utils";

export function MediaTile({
  media,
  url,
}: {
  readonly media: GalleryMedia;
  readonly url: string | undefined;
}): ReactElement {
  const isVideo = media.mime_type.startsWith("video/");

  return (
    <figure className="overflow-hidden rounded-md border">
      <div className="relative aspect-square bg-muted/40">
        {url && !isVideo && (
          <img
            src={url}
            alt={media.filename}
            className="absolute inset-0 size-full object-contain p-1"
          />
        )}
        {url && isVideo && (
          <video
            src={url}
            controls
            className="absolute inset-0 size-full object-contain"
          />
        )}
        {!url && (
          <div className="absolute inset-0 grid place-items-center">
            {isVideo ? (
              <FileVideo
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <CircleAlert
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-2 border-t px-2 py-1.5">
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-xs font-medium"
            title={media.filename}
          >
            {media.filename}
          </span>
          <span className="block text-[11px] text-muted-foreground">
            {media.type} · {formatSize(media.size_bytes)}
          </span>
        </span>
        {url && (
          <Button
            size="icon"
            variant="ghost"
            className="size-7 shrink-0"
            render={
              <a
                href={url}
                download={media.filename}
                aria-label={`Unduh ${media.filename}`}
              />
            }
          >
            <Download aria-hidden="true" />
          </Button>
        )}
      </figcaption>
    </figure>
  );
}
