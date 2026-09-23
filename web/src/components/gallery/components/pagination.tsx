import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  meta,
  onPageChange,
}: {
  readonly meta: {
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
  };
  readonly onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        {meta.from ?? 0}–{meta.to ?? 0} dari {meta.total} Gallery
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          <ChevronLeft aria-hidden="true" /> Sebelumnya
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          Berikutnya <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}