import { Heart, Images, Smile } from "lucide-react";
import { useState, type ReactElement } from "react";

import photoBoothLogo from "@/assets/Logo Kolase.png";
import { Skeleton } from "@/components/ui/skeleton";
import { GalleryError } from "./components/gallery-error";
import { GalleryMediaCard } from "./components/gallery-media-card";
import { formatDate } from "@/lib/utils";
import { usePublicGallery } from "./hooks/use-public-gallery";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

const pageClassName =
  "min-h-svh bg-background px-5 text-foreground overflow-x-hidden antialiased selection:bg-primary selection:text-primary-foreground sm:px-8 [font-family:'Geist_Variable',sans-serif] [background-image:radial-gradient(var(--gallery-dot)_1px,transparent_1px)] [background-size:22px_22px] [--background:#fff8f4] [--foreground:#513e45] [--card:#fffcf9] [--muted:#f5e9e8] [--muted-foreground:#77616a] [--border:#e9d6d7] [--primary:#a84665] [--primary-foreground:#fff9f6] [--gallery-dot:#eadbd8] dark:[--background:#2a2329] dark:[--foreground:#f8eaf0] dark:[--card:#342930] dark:[--muted:#3c3038] dark:[--muted-foreground:#c5adb8] dark:[--border:#59424d] dark:[--primary:#eeb3c4] dark:[--primary-foreground:#39212a] dark:[--gallery-dot:#44353d]";

export function PublicGalleryPage(): ReactElement {
  const [time] = useState(() => Date.now());
  const { gallery, retry, state, error, validToken } = usePublicGallery();

  function getDaysRemaining(expiresAt: string | null): number | null {
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt).getTime() - time;
    return Number.isFinite(diffMs)
      ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      : null;
  }

  useSmoothScroll();

  const daysRemaining = getDaysRemaining(gallery?.expires_at ?? null);

  if (!validToken) {
    return (
      <main className={pageClassName} lang="id">
        <div className="mx-auto max-w-2xl py-12 sm:py-24">
          <GalleryError message="Token gallery tidak valid." />
        </div>
      </main>
    );
  }

  return (
    <main className={pageClassName} lang="id">
      <div className="mx-auto max-w-6xl relative pt-4">
        <header className="flex items-center justify-between gap-4 sm:py-2 rounded-3xl px-4 py-2 border border-border bg-card shadow-[0_4px_0_var(--border)]">
          <div className="">
            <img
              src={photoBoothLogo}
              alt="Kolase Photobooth"
              width={1000}
              height={1000}
              className="h-auto w-24 shrink-0 object-contain dark:invert md:w-36"
            />
          </div>
          <div className="flex items-center gap-3">
            <nav
              className="flex items-center gap-2"
              aria-label="Media sosial Kolase"
            >
              <a
                href="https://www.instagram.com/kolasephotobooth/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Kolase (buka tab baru)"
                className="grid size-11 place-items-center rounded-full border border-border bg-card text-primary  hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  className="size-5"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@kolasephotobooth"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok Kolase (buka tab baru)"
                className="grid size-11 place-items-center rounded-full border border-border bg-card text-primary hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                  aria-hidden="true"
                >
                  <path d="M16.6 2h-3.4v13.5a3 3 0 1 1-2.6-3V9.1a6.4 6.4 0 1 0 6 6.4V8.7A8.4 8.4 0 0 0 22 10V6.6A5.4 5.4 0 0 1 16.6 2Z" />
                </svg>
              </a>
            </nav>
          </div>
        </header>

        <section
          className="relative pb-9 pt-8 sm:pb-12 sm:pt-12"
          aria-labelledby="gallery-title"
        >
          <svg
            className="pointer-events-none absolute -left-12 top-16 md:left-0 md:top-20 w-28 h-20 md:h-36 md:w-40 -rotate-12 "
            viewBox="0 0 180 155"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M37 46L46 27H77L85 46"
              fill="#FBE7A7"
              stroke="#795A64"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <rect
              x="15"
              y="42"
              width="150"
              height="98"
              rx="23"
              fill="#F4C9D8"
              stroke="#795A64"
              strokeWidth="3"
            />
            <path d="M17 72H163" stroke="#795A64" strokeWidth="3" />
            <rect
              x="124"
              y="53"
              width="25"
              height="12"
              rx="4"
              fill="#FFF8ED"
              stroke="#795A64"
              strokeWidth="2"
            />
            <circle
              cx="84"
              cy="92"
              r="34"
              fill="#FFF8ED"
              stroke="#795A64"
              strokeWidth="3"
            />
            <circle cx="75" cy="86" r="3" fill="#795A64" />
            <circle cx="94" cy="86" r="3" fill="#795A64" />
            <path
              d="M74 97Q84 111 95 97"
              stroke="#795A64"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <ellipse cx="64" cy="95" rx="5" ry="3" fill="#E9A5B8" />
            <ellipse cx="105" cy="95" rx="5" ry="3" fill="#E9A5B8" />
            <path
              d="M132 19V31M126 25H138M158 4V20M150 12H166"
              stroke="#A77941"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <div
            className="pointer-events-none absolute md:right-5 md:top-24 -right-12 top-24 flex rotate-12 flex-col items-center rounded-[45%_45%_42%_42%] border-2 border-dashed border-[#dec87f] bg-[#fff0bc] md:px-6 md:py-5 px-2 py-3 text-[#795b33] lg:flex"
            aria-hidden="true"
          >
            <Smile className="mb-2 size-8 md:size-10" strokeWidth={1.5} />
            <span className="text-sm font-bold">say cheese!</span>
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            <h1
              id="gallery-title"
              className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.12] tracking-[-0.055em] font-[ui-rounded,'Geist_Variable',sans-serif]"
            >
              {daysRemaining === null
                ? "Your gallery......."
                : daysRemaining === 0
                  ? "Gallery expired"
                  : "Expires in"}
              {daysRemaining !== null && daysRemaining > 0 && (
                <span className="mt-1 block text-primary">
                  {daysRemaining} {daysRemaining === 1 ? "day" : "days"}.
                </span>
              )}
            </h1>
          </div>

          {gallery && (
            <dl className="mx-auto md:grid mt-8 hidden max-w-3xl grid-cols-2 gap-5 rounded-3xl border border-border bg-card p-5 text-xs shadow-[0_4px_0_var(--border)] sm:mt-10 sm:grid-cols-[0.6fr_1fr_1fr] sm:gap-6 sm:px-7 sm:text-sm">
              <div className="col-span-2 flex items-center justify-between border-b border-dashed border-border pb-3 sm:col-span-1 sm:block sm:border-b-0 sm:pb-0">
                <dt className="text-xs text-muted-foreground">Sesi fotomu</dt>
                <dd className="font-bold tabular-nums text-primary sm:mt-1.5">
                  #{gallery.session_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Diambil pada</dt>
                <dd className="mt-1.5 font-medium leading-relaxed">
                  {gallery.completed_at
                    ? formatDate(gallery.completed_at)
                    : "Guest"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Simpan sebelum
                </dt>
                <dd className="mt-1.5 font-medium leading-relaxed">
                  {gallery.expires_at ? formatDate(gallery.expires_at) : "-"}
                </dd>
              </div>
            </dl>
          )}
        </section>

        {state === "loading" && (
          <div role="status" aria-label="Memuat galeri" className="py-3 space-y-8">
            <dl className="mx-auto md:grid mt-8 hidden max-w-3xl grid-cols-2 gap-5 rounded-3xl border border-border bg-card p-5 text-xs shadow-[0_4px_0_var(--border)] sm:mt-10 sm:grid-cols-[0.6fr_1fr_1fr] sm:gap-6 sm:px-7 sm:text-sm">
              <div className="col-span-2 flex items-center justify-between border-b border-dashed border-border pb-3 sm:col-span-1 sm:block sm:border-b-0 sm:pb-0">
                <dt className="text-xs text-muted-foreground">
                  <Skeleton className="h-4 w-3/4 animate-none rounded-full" />
                </dt>
                <dd className="font-bold tabular-nums text-primary sm:mt-1.5">
                  <Skeleton className="h-4 w-3/4 animate-none rounded-full" />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  <Skeleton className="h-4 w-3/4 animate-none rounded-full" />
                </dt>
                <dd className="mt-1.5 font-medium leading-relaxed">
                  <Skeleton className="h-4 w-3/4 animate-none rounded-full" />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  <Skeleton className="h-4 w-3/4 animate-none rounded-full" />
                </dt>
                <dd className="mt-1.5 font-medium leading-relaxed">
                  <Skeleton className="h-4 w-3/4 animate-none rounded-full" />
                </dd>
              </div>
            </dl>
            <div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              aria-hidden="true"
            >
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-[3px_4px_0_var(--border)]"
                >
                  <Skeleton className="aspect-4/3 w-full animate-none rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 animate-none rounded-full" />
                  <Skeleton className="h-3 w-1/2 animate-none rounded-full" />
                  <Skeleton className="h-11 w-full animate-none rounded-2xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {state === "error" && <GalleryError message={error} onRetry={retry} />}

        {state === "success" && gallery && (
          <section aria-labelledby="collection-title">
            <div className="flex items-center justify-between gap-4 pb-7 pt-3">
              <h2
                id="collection-title"
                className="flex items-center gap-2.5 text-xl font-bold tracking-tight sm:text-2xl"
              >
                Album kecilmu
                <span className="grid min-w-7 place-items-center rounded-full bg-muted px-2 py-1 text-xs font-semibold tabular-nums tracking-normal text-primary">
                  {gallery.media.length}
                </span>
              </h2>
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <Heart className="size-3.5" aria-hidden="true" /> tiap momen,
                berarti
              </span>
            </div>
            {gallery.media.length === 0 ? (
              <div className="grid min-h-80 place-items-center rounded-4xl border-2 border-dashed border-border bg-card px-6 py-12">
                <div className="max-w-sm text-center">
                  <div className="mx-auto grid size-20 -rotate-6 place-items-center rounded-3xl bg-muted">
                    <Images
                      className="size-9 text-primary"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold tracking-tight">
                    Albumnya masih kosong.
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Belum ada foto atau video di sesi ini. Kenanganmu akan
                    tampil di sini saat sudah tersedia.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="grid items-start gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
                role="list"
                aria-label="Media Public Gallery"
              >
                {gallery.media.map((media, index) => (
                  <div
                    key={media.id}
                    role="listitem"
                    className="min-w-0 [--tape:#f3d6e0] even:[--tape:#d4e8d9] nth-[3n]:[--tape:#ffe5a6]"
                  >
                    <div
                      className="mb-2 pl-1 text-xs font-semibold tabular-nums text-muted-foreground"
                      aria-hidden="true"
                    >
                      kenangan {String(index + 1).padStart(2, "0")}
                    </div>
                    <GalleryMediaCard token={validToken} media={media} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="flex flex-col items-center gap-3 py-12 text-center sm:py-14">
          <div
            className="flex items-center gap-3 text-primary"
            aria-hidden="true"
          >
            <span className="h-px w-8 bg-border" />
            <Heart className="size-4 fill-primary/15" />
            <span className="h-px w-8 bg-border" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Disimpan di galeri, dikenang di hati.
          </p>
          <p className="text-xs text-muted-foreground">
            Dari <span className="font-bold text-primary">kolase.</span> untuk
            kamu.
          </p>
        </footer>
      </div>
    </main>
  );
}
