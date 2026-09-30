import { actionLabelsAudit } from "@/constants";
import type { AuditLogRecord } from "@/features/audit-logs/audit-log.types";
import { subjectName } from "@/lib/utils";

/** Label action audit; fallback ke nilai mentah saat backend mengirim action tak dikenal. */
export function auditActionLabel(action: string): string {
  return actionLabelsAudit[action] ?? action;
}

/** Nama subject beserta nomornya, mis. "Template #12" (tanpa nomor bila id kosong). */
export function auditSubjectLabel(
  subject: Pick<AuditLogRecord, "subject_type" | "subject_id">,
): string {
  const name = subjectName(subject.subject_type);
  return subject.subject_id ? `${name} #${subject.subject_id}` : name;
}
