import { Eye } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { statusLabels } from "@/features/events/event.constants";
import type { EventRecord } from "@/features/events/event.types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function formatPrice(value: string | number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function EventTableRow({
  event,
}: {
  readonly event: EventRecord;
}) {
  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-4 align-middle">
        <div className="font-medium">{event.event_name}</div>
        <div className="font-mono text-xs text-muted-foreground">
          {event.event_code}
        </div>
      </td>
      <td className="p-4 align-middle">
        <div>{formatDate(event.event_date)}</div>
        <div className="text-xs text-muted-foreground">
          {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}
        </div>
      </td>
      <td className="p-4 align-middle">
        <div>{event.booth.name}</div>
        <div className="text-xs text-muted-foreground">
          {event.partner.brand_name || event.partner.company_name}
        </div>
      </td>
      <td className="p-4 align-middle">
        <Badge
          variant={
            event.status === "cancelled"
              ? "destructive"
              : event.status === "completed"
                ? "secondary"
                : "default"
          }
        >
          {statusLabels[event.status]}
        </Badge>
      </td>
      <td className="p-4 align-middle">{formatPrice(event.price)}</td>
      <td className="p-4 align-middle text-right">
        <Button
          size="sm"
          variant="outline"
          render={<Link to={`/admin/events/${event.id}`} />}
        >
          <Eye aria-hidden="true" /> Detail
        </Button>
      </td>
    </tr>
  );
}
