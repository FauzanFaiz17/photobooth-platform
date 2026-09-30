import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AuditLogRecord } from "@/features/audit-logs/audit-log.types";
import { date } from "@/lib/utils";
import type { ReactElement } from "react";
import { auditActionLabel, auditSubjectLabel } from "../utils";

export function AuditDetail({
  log,
  partner,
  onClose,
}: {
  readonly log: AuditLogRecord;
  readonly partner: string;
  readonly onClose: () => void;
}): ReactElement {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Audit Log #{log.id}</DialogTitle>
          <DialogDescription>{date(log.created_at)}</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Action</dt>
            <dd className="mt-1 font-medium">{auditActionLabel(log.action)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Partner</dt>
            <dd className="mt-1 font-medium">{partner}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">User</dt>
            <dd className="mt-1 font-medium">
              {log.user_id ? `User #${log.user_id}` : "Sistem/publik"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Subject</dt>
            <dd className="mt-1 font-medium">{auditSubjectLabel(log)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">IP address</dt>
            <dd className="mt-1 font-mono text-sm">{log.ip_address ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">User agent</dt>
            <dd className="mt-1 wrap-break-word text-sm">
              {log.user_agent ?? "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Deskripsi</dt>
            <dd className="mt-1">{log.description ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Metadata</dt>
            <dd className="mt-1 max-h-64 overflow-auto rounded-md border bg-muted/40 p-3">
              <pre className="whitespace-pre-wrap wrap-break-word text-xs">
                {log.metadata
                  ? JSON.stringify(log.metadata, null, 2)
                  : "Tidak ada metadata"}
              </pre>
            </dd>
          </div>
        </dl>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}