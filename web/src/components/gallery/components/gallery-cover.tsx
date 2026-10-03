import type { GalleryRecord } from "@/features/galleries/gallery.types";
import { Images } from "lucide-react";
import type { ReactElement } from "react";
import { coverMedia, galleryToken } from "../utils";
import { useMediaUrl } from "../hooks/use-media-url";

export function GalleryCover({
  gallery,
}: {
  readonly gallery: GalleryRecord;
}): ReactElement {
  const token = galleryToken(gallery.gallery_url);
  const cover = coverMedia(gallery.media);
  const { url, failed } = useMediaUrl(token, cover?.id ?? null);

  return (
    <div className="relative aspect-4/3 w-full overflow-hidden border-b bg-muted/40">
      {url ? (
        <img
          src={url}
          alt={`Media sesi ${gallery.id}`}
          className="absolute inset-0 size-full object-contain p-2 rounded-2xl"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center gap-1 text-center">
          <Images
            className="size-10 text-muted-foreground"
            aria-hidden="true"
          />
          {(failed || !token || !cover) && (
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
