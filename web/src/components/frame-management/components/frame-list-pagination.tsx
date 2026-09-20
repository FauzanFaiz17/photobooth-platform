import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/lib/pagination";

interface FrameListPaginationProps {
  readonly meta: PaginationMeta;
  readonly onPageChange: (page: number) => void;
}

export function FrameListPagination({
  meta,
  onPageChange,
}: FrameListPaginationProps) {
  const currentPage = meta.current_page;

  return (
    <div className="mt-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        {meta.from ?? 0}–{meta.to ?? 0} dari {meta.total} Frame
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" /> Sebelumnya
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage >= meta.last_page}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Berikutnya <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
