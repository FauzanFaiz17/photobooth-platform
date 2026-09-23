import type { ReactElement } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { currency } from "@/lib/utils";

export function TransactionStats({
  summary,
}: {
  readonly summary: {
    net: number;
    paid: number;
    pending: number;
    failed: number;
    voucher: number;
  };
}): ReactElement {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Ringkasan Payment"
    >
      {[
        ["Net Dibayar", currency(summary.net)],
        ["Dibayar", String(summary.paid)],
        ["Pending", String(summary.pending)],
        ["Gagal/Expired", String(summary.failed)],
        ["Voucher", String(summary.voucher)],
      ].map(([label, value]) => (
        <Card key={label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              pada halaman ini
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
