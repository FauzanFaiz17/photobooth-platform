import { Download } from "lucide-react";
import type { ReactElement } from "react";

import type { PublicGalleryMedia } from "@/features/public-gallery/public-gallery.types";
import { GalleryMediaPreview } from "./gallery-media-preview";
import { formatSize } from "../utils";

export function GalleryMediaCard({
  token,
  media,
}: {
  readonly token: string;
  readonly media: PublicGalleryMedia;
}): ReactElement {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <GalleryMediaPreview token={token} media={media} />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="min-w-0 truncate text-sm font-semibold text-foreground"
            title={media.filename}
          >
            {media.filename}
          </h3>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatSize(media.size_bytes)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {media.type} &middot; {media.mime_type}
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div>
            <dt className="text-muted-foreground">Ukuran</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {media.width && media.height
                ? `${media.width} × ${media.height}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Durasi</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {media.duration_seconds
                ? `${media.duration_seconds} detik`
                : "—"}
            </dd>
          </div>
        </dl>
        <a
          href={media.download_url}
          download={media.filename}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:bg-foreground/80"
        >
          <Download className="size-4" aria-hidden="true" /> Download
        </a>
      </div>
    </article>
  );
}
