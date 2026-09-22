import { fetchGalleryMediaUrl } from "@/features/galleries/gallery-service";
import type { GalleryRecord } from "@/features/galleries/gallery.types";
import { Images } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import { coverMedia, galleryToken } from "../utils";

export function GalleryCover({
  gallery,
}: {
  readonly gallery: GalleryRecord;
}): ReactElement {
  const token = galleryToken(gallery.gallery_url);
  const cover = coverMedia(gallery.media);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (!token || !cover) return;
    const controller = new AbortController();
    let created: string | null = null;

    fetchGalleryMediaUrl(token, cover.id, controller.signal)
      .then((url) => {
        if (controller.signal.aborted) return void URL.revokeObjectURL(url);
        created = url;
        setObjectUrl(url);
      })
      .catch(() => {
        if (!controller.signal.aborted) setBroken(true);
      });

    return () => {
      controller.abort();
      if (created) URL.revokeObjectURL(created);
    };
  }, [cover, token]);

  return (
    <div className="relative aspect-4/3 w-full overflow-hidden border-b bg-muted/40">
      {objectUrl ? (
        <img
          src={objectUrl}
          alt={`Media sesi ${gallery.id}`}
          className="absolute inset-0 size-full object-contain p-2"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center gap-1 text-center">
          <Images
            className="size-10 text-muted-foreground"
            aria-hidden="true"
          />
          {(broken || !token || !cover) && (
            <span className="px-3 text-[11px] leading-tight text-muted-foreground">
              {!cover
                ? "Tidak ada gambar"
                : !token
                  ? "Link gallery belum dibuat"
                  : "Media belum bisa dimuat"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}