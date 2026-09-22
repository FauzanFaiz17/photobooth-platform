import { Images } from "lucide-react";
import { type ReactElement } from "react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GalleryError } from "./components/gallery-error";
import { GalleryMediaCard } from "./components/gallery-media-card";
import { formatDate } from "@/lib/utils";
import { usePublicGallery } from "./hooks/use-public-gallery";

export function PublicGalleryPage(): ReactElement {
  const { gallery, retry, state, error, validToken } = usePublicGallery();

  if (!validToken) {
    return (
      <main className="min-h-screen bg-muted/30 p-4 sm:p-8">
        <GalleryError message="Token gallery tidak valid." />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-sm font-medium text-muted-foreground">
            Photo Booth Gallery
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Galeri Foto
          </h1>
          {gallery && (
            <p className="mt-2 text-sm text-muted-foreground">
              Sesi #{gallery.session_id} · selesai{" "}
              {gallery.completed_at
                ? formatDate(gallery.completed_at)
                : "Guest"}{" "}
              · berlaku sampai{" "}
              {gallery.expires_at ? formatDate(gallery.expires_at) : "-"}
            </p>
          )}
        </header>
        {state === "loading" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-56" />
            ))}
          </div>
        )}
        {state === "error" && <GalleryError message={error} onRetry={retry} />}
        {state === "success" && gallery && (
          <>
            {gallery.media.length === 0 ? (
              <Card>
                <CardContent className="grid min-h-64 place-items-center text-center">
                  <div>
                    <Images
                      className="mx-auto size-10 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="mt-3 font-medium">Belum ada media</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Photo Session ini belum memiliki media yang bisa diunduh.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <section
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
