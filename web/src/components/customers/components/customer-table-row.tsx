import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CustomerRecord } from "@/features/customers/customer.types";
import { formatDateTime } from "../customer-formatters";

export function CustomerTableRow({
  customer,
  partnerName,
  superAdmin,
  onDetail,
}: {
  readonly customer: CustomerRecord;
  readonly partnerName: (id: number | null) => string;
  readonly superAdmin: boolean;
  readonly onDetail: () => void;
}) {
  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-4 font-medium">
        {customer.name || `Customer #${customer.id}`}
      </td>
      <td className="p-4">{customer.phone || "\u2014"}</td>
      <td className="p-4">{customer.email || "\u2014"}</td>
      {superAdmin && <td className="p-4">{partnerName(customer.partner_id)}</td>}
      <td className="p-4 text-right tabular-nums">
        {customer.photo_sessions_count}
      </td>
      <td className="p-4">{formatDateTime(customer.created_at)}</td>
      <td className="p-4 text-right">
        <Button
          size="icon-sm"
          variant="outline"
          aria-label={`Detail Customer ${customer.id}`}
          onClick={onDetail}
        >
          <Eye aria-hidden="true" />
        </Button>
      </td>
    </tr>
  );
}
