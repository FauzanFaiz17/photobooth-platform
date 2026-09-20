import { CircleAlert, Frame, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const skeletonCards = Array.from({ length: 6 }, (_, index) => index);

export function FrameListLoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {skeletonCards.map((item) => (
        <Skeleton key={item} className="h-96 rounded-xl" />
      ))}
    </div>
  );
}

export function FrameListErrorState({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}) {
  return (
    <div className="grid min-h-64 place-items-center text-center">
      <div>
        <CircleAlert className="mx-auto size-10 text-destructive" aria-hidden="true" />
        <p className="mt-3 font-medium">Daftar Frame gagal dimuat</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCw aria-hidden="true" /> Coba lagi
        </Button>
      </div>
    </div>
  );
}

export function FrameListEmptyState({
  filtered,
  onReset,
}: {
  readonly filtered: boolean;
  readonly onReset: () => void;
}) {
  return (
    <div className="grid min-h-64 place-items-center text-center">
      <div>
        <Frame className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 font-medium">
          {filtered ? "Frame tidak ditemukan" : "Belum ada Frame"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered
            ? "Ubah atau reset filter pencarian."
            : "Tambahkan Frame pertama untuk Partner."}
        </p>
        {filtered && (
          <Button variant="outline" className="mt-4" onClick={onReset}>
            <RefreshCw aria-hidden="true" /> Reset filter
          </Button>
        )}
      </div>
    </div>
  );
}
