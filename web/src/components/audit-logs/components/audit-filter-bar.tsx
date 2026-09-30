import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actionLabelsAudit } from "@/constants";
import { AUDIT_ACTIONS } from "@/features/audit-logs/audit-log.types";
import type { PartnerRecord } from "@/features/partners/partner.types";

export function AuditFilterBar({
  partnerId,
  partners,
  onReset,
  action,
  filtered,
  onUpdate,
}: {
  readonly partnerId: number;
  readonly action: string;
  readonly filtered: boolean;
  readonly partners: ReadonlyArray<PartnerRecord>;
  readonly onUpdate: (values: Readonly<Record<string, string | null>>) => void;
  readonly onReset: () => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto]">
      <Select
        value={partnerId ? String(partnerId) : "all"}
        onValueChange={(value) =>
          value &&
          onUpdate({
            partner_id: value === "all" ? null : value,
            page: null,
          })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Partner</SelectItem>
          {partners.map((partner) => (
            <SelectItem key={partner.id} value={String(partner.id)}>
              {partner.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={action || "all"}
        onValueChange={(value) =>
          value &&
          onUpdate({ action: value === "all" ? null : value, page: null })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Action</SelectItem>
          {AUDIT_ACTIONS.map((item) => (
            <SelectItem key={item} value={item}>
              {actionLabelsAudit[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" disabled={!filtered} onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
