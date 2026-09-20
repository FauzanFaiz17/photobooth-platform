import { CalendarDays, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function EventListLoading() {
  return (
    <div className="space-y-3 p-6" aria-busy>
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function EventListError({
  errorMessage,
  onRetry,
}: {
  readonly errorMessage: string;
  readonly onRetry: () => void;
}) {
  return (
    <div className="grid min-h-64 place-items-center p-6 text-center">
      <div>
        <p className="font-medium">Daftar Event gagal dimuat</p>
        <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          <RefreshCw aria-hidden="true" /> Coba lagi
        </Button>
      </div>
    </div>
  );
}

export function EventListEmpty({ filtered }: { readonly filtered: boolean }) {
  return (
    <div className="grid min-h-64 place-items-center p-6 text-center">
      <div>
        <CalendarDays className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 font-medium">
          {filtered ? "Event tidak ditemukan" : "Belum ada Event"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered
            ? "Ubah atau reset filter pencarian."
            : "Tambahkan Event pertama untuk salah satu Booth."}
        </p>
      </div>
    </div>
  );
}
