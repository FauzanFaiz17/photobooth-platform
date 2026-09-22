import type { ReactElement } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PRINT_JOB_STATUSES, type PrintJobStatus } from "@/features/print-jobs/print-job.types";
import { labels } from "@/constants";

export function PrintJobsStats({
  counts,
}: {
  readonly counts: Record<PrintJobStatus, number>;
}): ReactElement {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {PRINT_JOB_STATUSES.map((item) => (
        <Card key={item}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">
              {labels[item]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {counts[item]}
            </p>
            <p className="text-xs text-muted-foreground">
              pada halaman ini
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
