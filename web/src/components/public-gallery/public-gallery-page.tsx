import { Images } from "lucide-react";
import { type ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { GalleryError } from "./components/gallery-error";
import { GalleryMediaCard } from "./components/gallery-media-card";
import { formatDate } from "@/lib/utils";
import { usePublicGallery } from "./hooks/use-public-gallery";

export function PublicGalleryPage(): ReactElement {
  const { gallery, retry, state, error, validToken } = usePublicGallery();

  if (!validToken) {
    return (
      <main className="min-h-screen bg-[#fafaf9] p-4 sm:p-8 lg:p-12">
        <GalleryError message="Token gallery tidak valid." />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] p-4 sm:p-8 lg:p-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Photo Booth Gallery
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Galeri Foto
          </h1>
          {gallery && (
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              Sesi #{gallery.session_id} &middot; selesai{" "}
              {gallery.completed_at
                ? formatDate(gallery.completed_at)
                : "Guest"}{" "}
              &middot; berlaku sampai{" "}
              {gallery.expires_at ? formatDate(gallery.expires_at) : "-"}
            </p>
          )}
        </header>

        {state === "loading" && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        )}

        {state === "error" && <GalleryError message={error} onRetry={retry} />}

        {state === "success" && gallery && (
          <>
            {gallery.media.length === 0 ? (
              <div className="grid min-h-[28rem] place-items-center rounded-2xl border border-dashed border-border bg-white/50">
                <div className="text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
                    <Images
                      className="size-7 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-5 text-base font-semibold text-foreground">
                    Belum ada media
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Photo Session ini belum memiliki media yang bisa diunduh.
                  </p>
                </div>
              </div>
            ) : (
              <section
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                aria-label="Media Public Gallery"
              >
                {gallery.media.map((media) => (
                  <GalleryMediaCard
                    key={media.id}
                    token={validToken}
                    media={media}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
