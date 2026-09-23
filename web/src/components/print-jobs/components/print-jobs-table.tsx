import { Ban, Eye, RotateCcw } from "lucide-react";
import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PartnerRecord } from "@/features/partners/partner.types";
import type { PrintJobRecord } from "@/features/print-jobs/print-job.types";
import { date } from "@/lib/utils"; 
import { labels, variants } from "@/constants";

export function PrintJobsTable({
  jobs,
  superAdmin,
  partners,
  onViewDetail,
  onAction,
}: {
  readonly jobs: ReadonlyArray<PrintJobRecord>;
  readonly superAdmin: boolean;
  readonly partners: ReadonlyArray<PartnerRecord>;
  readonly onViewDetail: (job: PrintJobRecord) => void;
  readonly onAction: (job: PrintJobRecord) => void;
}): ReactElement {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job</TableHead>
          {superAdmin && <TableHead>Partner</TableHead>}
          <TableHead>Printer</TableHead>
          <TableHead>Photo Session</TableHead>
          <TableHead>Salinan</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Queued</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-mono">#{job.id}</TableCell>
            {superAdmin && (
              <TableCell>
                {partners.find(
                  (partner) => partner.id === job.partner_id,
                )?.company_name ?? `Partner #${job.partner_id}`}
              </TableCell>
            )}
            <TableCell>
              {job.printer?.name ?? `Printer #${job.printer_id}`}
            </TableCell>
            <TableCell className="font-mono">
              #{job.photo_session_id}
            </TableCell>
            <TableCell>{job.copies}</TableCell>
            <TableCell>
              <Badge variant={variants[job.status]}>
                {labels[job.status]}
              </Badge>
            </TableCell>
            <TableCell>{date(job.queued_at)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Detail Print Job ${job.id}`}
                  onClick={() => onViewDetail(job)}
                >
                  <Eye aria-hidden="true" />
                </Button>
                {job.status === "queued" && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Batalkan Print Job ${job.id}`}
                    onClick={() => onAction(job)}
                  >
                    <Ban aria-hidden="true" />
                  </Button>
                )}
                {job.status === "failed" && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Retry Print Job ${job.id}`}
                    onClick={() => onAction(job)}
                  >
                    <RotateCcw aria-hidden="true" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
