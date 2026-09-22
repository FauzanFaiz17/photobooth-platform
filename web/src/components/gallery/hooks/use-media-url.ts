import { fetchGalleryMediaUrl } from "@/features/galleries/gallery-service";
import type { GalleryMedia } from "@/features/galleries/gallery.types";
import { useEffect, useState } from "react";

/**
 * Setiap pengambilan media menaikkan download_count di backend, jadi berkas hanya
 * diambil saat dialog benar-benar dibuka — bukan ikut ter-load bersama daftar kartu.
 */
export function useMediaUrls(
  token: string | null,
  media: ReadonlyArray<GalleryMedia>,
): {
  urls: ReadonlyMap<number, string>;
  loading: boolean;
  failed: boolean;
} {
  const [urls, setUrls] = useState<ReadonlyMap<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    const created: string[] = [];

    async function load() {
      const entries = await Promise.all(
        media.map(async (item) => {
          try {
            const url = await fetchGalleryMediaUrl(
              token as string,
              item.id,
              controller.signal,
            );
            created.push(url);
            return [item.id, url] as const;
          } catch {
            return null;
          }
        }),
      );

      if (controller.signal.aborted) return;
      const resolved = entries.filter(
        (entry): entry is readonly [number, string] => entry !== null,
      );
      setUrls(new Map(resolved));
      setFailed(resolved.length === 0 && media.length > 0);
      setLoading(false);
    }

    void load();

    return () => {
      controller.abort();
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [media, token]);

  // Tanpa token media tidak bisa diambil sama sekali, jadi statusnya turunan, bukan efek.
  if (!token) return { urls, loading: false, failed: media.length > 0 };

  return { urls, loading, failed };
}