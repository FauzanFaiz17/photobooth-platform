import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentListResponse } from "@/features/payments/payment.types";

export function TransactionPagination({
  meta,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
}: {
  readonly meta: PaymentListResponse["meta"];
  readonly page: number;
  readonly perPage: number;
  readonly onPageChange: (page: number | null) => void;
  readonly onPerPageChange: (value: string | null) => void;
}): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 pt-4 sm:px-6">
      <p className="text-sm text-muted-foreground">
        {meta.from ?? 0}–{meta.to ?? 0} dari{" "}
        {meta.total} Payment
      </p>
      <div className="flex items-center gap-2">
        <Select
          value={String(perPage)}
          onValueChange={onPerPageChange}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} baris
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() =>
            onPageChange(page - 1 === 1 ? null : page - 1)
          }
        >
          <ChevronLeft /> Sebelumnya
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= meta.last_page}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
