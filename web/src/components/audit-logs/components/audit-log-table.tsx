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
import { actionLabelsAudit } from "@/constants";
import type { AuditLogPage, AuditLogRecord } from "@/features/audit-logs/audit-log.types";
import { date, subjectName } from "@/lib/utils";
import { Eye } from "lucide-react";


export function AuditLogTable({
    log,
    partnerName,
    onDetail
}: {
    readonly log: AuditLogPage,
    readonly partnerName: (id: number | null) => string,
    readonly onDetail: (log: AuditLogRecord) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Waktu</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Partner</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Deskripsi</TableHead>
          <TableHead className="text-right">Detail</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {log.data.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{date(log.created_at)}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {actionLabelsAudit[log.action] ?? log.action}
              </Badge>
            </TableCell>
            <TableCell>{partnerName(log.partner_id)}</TableCell>
            <TableCell>{log.user_id ? `#${log.user_id}` : "—"}</TableCell>
            <TableCell>
              {subjectName(log.subject_type)}
              {log.subject_id ? ` #${log.subject_id}` : ""}
            </TableCell>
            <TableCell
              className="max-w-80 truncate"
              title={log.description ?? undefined}
            >
              {log.description ?? "—"}
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Detail Audit Log ${log.id}`}
                onClick={() => onDetail(log)}
              >
                <Eye aria-hidden="true" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
