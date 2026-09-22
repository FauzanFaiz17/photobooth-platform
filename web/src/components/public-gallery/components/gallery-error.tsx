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
    <div className="grid min-h-[28rem] place-items-center rounded-2xl border border-dashed border-border bg-white/50">
      <div className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <TriangleAlert
            className="size-7 text-destructive"
            aria-hidden="true"
          />
        </div>
        <p className="mt-5 text-base font-semibold text-foreground">
          Gallery tidak dapat dibuka
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button className="mt-5" variant="outline" onClick={onRetry}>
            <RefreshCw aria-hidden="true" /> Coba lagi
          </Button>
        )}
      </div>
    </div>
  );
}
