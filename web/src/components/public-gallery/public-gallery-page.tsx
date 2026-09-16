import {
  Download,
  FileImage,
  FileVideo,
  Images,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchGalleryMediaUrl } from "@/features/galleries/gallery-service";
import { getPublicGallery } from "@/features/public-gallery/public-gallery-service";
import type {
  PublicGalleryMedia,
  PublicGalleryRecord,
} from "@/features/public-gallery/public-gallery.types";
import { ApiError } from "@/lib/api-client";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function formatSize(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}
function mediaIcon(media: PublicGalleryMedia): ReactElement {
  return media.mime_type.startsWith("video/") ? (
    <FileVideo className="size-8" aria-hidden="true" />
  ) : (
    <FileImage className="size-8" aria-hidden="true" />
  );
}

/**
 * Route media publik mengirim berkas sebagai attachment, jadi <img src> langsung tidak
 * andal — pakai objectURL dari fetch, sama seperti dialog "Lihat media".
 */
function GalleryMediaPreview({
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
    <div className="relative aspect-[4/3] w-full overflow-hidden border-b bg-muted/40">
      {url && !isVideo && (
        <img
          src={url}
          alt={media.filename}
          className="absolute inset-0 size-full object-contain p-2"
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
        <div className="absolute inset-0 grid place-items-center gap-1 text-center">
          {mediaIcon(media)}
          {failed && (
            <span className="px-3 text-[11px] leading-tight text-muted-foreground">
              Media belum bisa dimuat
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function PublicGalleryPage(): ReactElement {
  const { token } = useParams<{ token: string }>();
  const [gallery, setGallery] = useState<PublicGalleryRecord | null>(null);
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [requestKey, setRequestKey] = useState(0);
  const validToken = token && /^[A-Za-z0-9]{64}$/.test(token) ? token : null;

  useEffect(() => {
    if (!validToken) return;
    const controller = new AbortController();
    getPublicGallery(validToken, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setGallery(result);
          setState("success");
        }
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setGallery(null);
        setError(
          caught instanceof ApiError && caught.status === 410
            ? "Link gallery sudah kedaluwarsa."
            : caught instanceof ApiError && caught.status === 404
              ? "Gallery tidak ditemukan atau belum selesai."
              : caught instanceof ApiError
                ? caught.message
                : "Tidak dapat terhubung ke server.",
        );
        setState("error");
      });
    return () => controller.abort();
  }, [requestKey, validToken]);

  function retry(): void {
    setGallery(null);
    setError("");
    setState("loading");
    setRequestKey((value) => value + 1);
  }

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
              {gallery.completed_at ? formatDate(gallery.completed_at) : "Guest"} · berlaku sampai{" "}
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
                  <Card key={media.id} className="overflow-hidden pt-0">
                    <GalleryMediaPreview token={validToken} media={media} />
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
                      <Button
                        className="w-full"
                        render={
                          <a
                            href={media.download_url}
                            download={media.filename}
                          />
                        }
                      >
                        <Download aria-hidden="true" /> Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function GalleryError({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry?: () => void;
}): ReactElement {
  return (
    <Card className="mx-auto max-w-5xl">
      <CardContent className="grid min-h-64 place-items-center text-center">
        <div>
          <TriangleAlert
            className="mx-auto size-10 text-destructive"
            aria-hidden="true"
          />
          <p className="mt-3 font-medium">Public Gallery tidak dapat dibuka</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          {onRetry && (
            <Button className="mt-4" variant="outline" onClick={onRetry}>
              <RefreshCw aria-hidden="true" /> Coba lagi
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
