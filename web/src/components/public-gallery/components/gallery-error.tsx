import { Card, CardContent } from "@/components/ui/card";
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