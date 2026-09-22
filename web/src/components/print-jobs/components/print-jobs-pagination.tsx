import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import type { PrintJobListResponse } from "@/features/print-jobs/print-job.types";

export function PrintJobsPagination({
  meta,
  page,
  onPageChange,
}: {
  readonly meta: PrintJobListResponse["meta"];
  readonly page: number;
  readonly onPageChange: (page: number | null) => void;
}): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 pt-4">
      <p className="text-sm text-muted-foreground">
        {meta.from ?? 0}–{meta.to ?? 0} dari{" "}
        {meta.total} Print Job
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() =>
            onPageChange(page - 1 === 1 ? null : page - 1)
          }
        >
          <ChevronLeft aria-hidden="true" /> Sebelumnya
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= meta.last_page}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
