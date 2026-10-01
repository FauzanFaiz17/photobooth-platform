import type { EventStatus } from "./event.types";

export const statusLabels: Record<EventStatus, string> = {
  draft: "Draft",
  scheduled: "Terjadwal",
  ongoing: "Berlangsung",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export function eventStatusVariant(
  status: EventStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "cancelled") return "destructive";
  if (status === "completed") return "secondary";
  if (status === "draft") return "outline"
  return "default";
}
