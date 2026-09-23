import { Button } from "@/components/ui/button";
import { RefreshCw, TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";

export function GalleryError({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry?: () => void;
}): ReactElement {
  return (
    <div role="alert" className="grid min-h-80 place-items-center rounded-[2rem] border-2 border-dashed border-border bg-card px-6 py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-20 -rotate-6 items-center justify-center rounded-3xl bg-muted text-primary">
          <TriangleAlert
            className="size-8"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
        <p className="mt-6 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
          Ups, albumnya belum terbuka.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>
        {onRetry && (
          <Button className="mt-6 h-12 gap-2 rounded-full px-6 transition-none active:not-aria-[haspopup]:translate-y-0" onClick={onRetry}>
            <RefreshCw aria-hidden="true" /> Coba lagi
          </Button>
        )}
      </div>
    </div>
  );
}
