import { useAuth } from "@/features/auth/auth-context";
import { getPrintJob } from "@/features/print-jobs/print-job-service";
import type { PrintJobRecord } from "@/features/print-jobs/print-job.types";
import { ApiError } from "@/lib/api-client";
import { useEffect, useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { date } from "../utils";
import { Badge } from "@/components/ui/badge";
import { labels, variants } from "@/constants";

export function PrintDetailDialog({
  job,
  onClose,
  onUnauthorized,
  onForbidden,
}: {
  readonly job: PrintJobRecord;
  readonly onClose: () => void;
  readonly onUnauthorized: () => void;
  readonly onForbidden: () => void;
}): ReactElement {
  const { token } = useAuth();
  const [detail, setDetail] = useState<PrintJobRecord | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    getPrintJob(token, job.id)
      .then(setDetail)
      .catch((caught: unknown) => {
        if (caught instanceof ApiError && caught.status === 401)
          return onUnauthorized();
        if (caught instanceof ApiError && caught.status === 403)
          return onForbidden();
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Tidak dapat terhubung ke server.",
        );
      });
    return () => controller.abort();
  }, [job.id, onForbidden, onUnauthorized, token]);
  const item = detail ?? job;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Print Job #{item.id}</DialogTitle>
          <DialogDescription>
            Photo Session #{item.photo_session_id}
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <Badge variant={variants[item.status]}>
                  {labels[item.status]}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Printer</dt>
              <dd className="mt-1 font-medium">
                {item.printer?.name ?? `Printer #${item.printer_id}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Salinan</dt>
              <dd className="mt-1 font-medium">{item.copies}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Durasi</dt>
              <dd className="mt-1 font-medium">
                {item.duration_ms === null ? "—" : `${item.duration_ms} ms`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Queued</dt>
              <dd className="mt-1 font-medium">{date(item.queued_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Selesai</dt>
              <dd className="mt-1 font-medium">{date(item.finished_at)}</dd>
            </div>
            {item.error_log && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Detail error</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-md border border-destructive/30 bg-destructive/5 p-3 font-mono text-xs text-destructive">
                  {item.error_log}
                </dd>
              </div>
            )}
          </dl>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}