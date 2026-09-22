import { Download } from "lucide-react";
import type { ReactElement } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="overflow-hidden pt-0">
      <GalleryMediaPreview token={token} media={media} />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle
            className="truncate text-base"
            title={media.filename}
          >
            {media.filename}
          </CardTitle>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatSize(media.size_bytes)}
          </span>
        </div>
        <CardDescription>
          {media.type} · {media.mime_type}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <dt>Ukuran</dt>
            <dd>
              {media.width && media.height
                ? `${media.width} × ${media.height}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Durasi</dt>
            <dd>
              {media.duration_seconds
                ? `${media.duration_seconds} detik`
                : "—"}
            </dd>
          </div>
        </dl>
        <a
          href={media.download_url}
          download={media.filename}
          className="inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 active:translate-y-px"
        >
          <Download aria-hidden="true" /> Download
        </a>
      </CardContent>
    </Card>
  );
}
