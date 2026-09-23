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
    <article className="relative min-w-0 rounded-3xl border border-border bg-card p-3.5 shadow-[3px_4px_0_var(--border)] sm:p-4">
      <div className="pointer-events-none absolute -top-2.5 left-1/2 z-10 h-5 w-16 -translate-x-1/2 -rotate-3 border-x border-dashed border-foreground/15 bg-(--tape) opacity-90" aria-hidden="true" />
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/40">
        <GalleryMediaPreview token={token} media={media} />
      </div>
      <div className="space-y-3 px-1 pb-1 pt-4">
        <div className="flex items-start justify-between gap-3">
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
        <p className="wrap-break-word text-xs text-muted-foreground">
          {media.type} &middot; {media.mime_type}
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-muted/60 px-3 py-2.5 text-xs">
          <div>
            <dt className="text-muted-foreground">Ukuran</dt>
            <dd className="mt-1 font-medium tabular-nums text-foreground">
              {media.width && media.height
                ? `${media.width} × ${media.height}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Durasi</dt>
            <dd className="mt-1 font-medium tabular-nums text-foreground">
              {media.duration_seconds
                ? `${media.duration_seconds} detik`
                : "—"}
            </dd>
          </div>
        </dl>
        <a
          href={media.download_url}
          download={media.filename}
          aria-label={`Unduh ${media.filename}`}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-foreground hover:text-background transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <Download className="size-4" strokeWidth={1.75} aria-hidden="true" /> Simpan kenangan
        </a>
      </div>
    </article>
  );
}
