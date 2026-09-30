import type { GalleryRecord } from "@/features/galleries/gallery.types";
import { date } from "@/lib/utils";

/** Backend mengirim gallery_url absolut ke domain web; dashboard sudah punya route /gallery/:token. */
export function galleryPath(url: string): string | null {
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

export function expiryState(expiresAt: string | null): {
  label: string;
  expired: boolean;
} {
  if (!expiresAt) return { label: "Tanpa batas", expired: false };
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime()))
    return { label: "Tanpa batas", expired: false };
  const expired = parsed.getTime() <= Date.now();
  return {
    label: expired ? "Kedaluwarsa" : `Aktif s/d ${date(expiresAt)}`,
    expired,
  };
}

export function mediaSummary(media: GalleryRecord["media"]): string {
  const counts = new Map<string, number>();
  for (const item of media)
    counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
  return (
    [...counts].map(([type, count]) => `${count} ${type}`).join(" · ") ||
    "Belum ada media"
  );
}

export function galleryToken(url: string | null): string | null {
  const path = url ? galleryPath(url) : null;
  return path?.match(/\/gallery\/([A-Za-z0-9]{64})$/)?.[1] ?? null;
}

/** Komposit final mewakili sesi paling baik; sisanya hanya potongan mentah. */
export function coverMedia(
  media: GalleryRecord["media"],
): GalleryRecord["media"][number] | null {
  const images = media.filter((item) => item.mime_type.startsWith("image/"));
  return images.find((item) => item.type === "template") ?? images[0] ?? null;
}