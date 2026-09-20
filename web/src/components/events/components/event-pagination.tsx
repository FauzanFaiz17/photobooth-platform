import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EventListResponse } from "@/features/events/event.types";

export function EventPagination({
  meta,
  onUpdateQuery,
  label = "Event",
}: {
  readonly meta: EventListResponse["meta"];
  readonly onUpdateQuery: (updates: Readonly<Record<string, string | null>>) => void;
  readonly label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 pt-4 sm:px-6">
      <p className="text-sm text-muted-foreground">
        {meta.from ?? 0}–{meta.to ?? 0} dari {meta.total} {label}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={meta.current_page <= 1}
          onClick={() =>
            onUpdateQuery({
              page:
                meta.current_page - 1 === 1
                  ? null
                  : String(meta.current_page - 1),
            })
          }
        >
          <ChevronLeft aria-hidden="true" /> Sebelumnya
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={meta.current_page >= meta.last_page}
          onClick={() =>
            onUpdateQuery({ page: String(meta.current_page + 1) })
          }
        >
          Berikutnya <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
