import { fetchGalleryMediaUrl } from "@/features/galleries/gallery-service";
import type { PublicGalleryMedia } from "@/features/public-gallery/public-gallery.types";
import { useEffect, useState, type ReactElement } from "react";
import { mediaIcon } from "./media-icon";

/**
 * Route media publik mengirim berkas sebagai attachment, jadi <img src> langsung tidak
 * andal — pakai objectURL dari fetch, sama seperti dialog "Lihat media".
 */
export function GalleryMediaPreview({
  token,
  media,
}: {
  readonly token: string;
  readonly media: PublicGalleryMedia;
}): ReactElement {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isVideo = media.mime_type.startsWith("video/");

  useEffect(() => {
    const controller = new AbortController();
    let created: string | null = null;

    fetchGalleryMediaUrl(token, media.id, controller.signal)
      .then((objectUrl) => {
        if (controller.signal.aborted) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        created = objectUrl;
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });

    return () => {
      controller.abort();
      if (created) URL.revokeObjectURL(created);
    };
  }, [media.id, token]);

  return (
    <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/30">
      {url && !isVideo && (
        <img
          src={url}
          alt={media.filename}
          className="absolute inset-0 size-full object-contain"
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
        <div className="absolute inset-0 grid place-items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            {mediaIcon(media)}
          </div>
          {failed && (
            <span className="max-w-40 px-4 text-xs leading-tight text-muted-foreground">
              Media belum bisa dimuat, refresh untuk memuat ulang media
            </span>
          )}
        </div>
      )}
    </div>
  );
}
