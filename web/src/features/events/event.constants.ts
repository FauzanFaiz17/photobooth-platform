import type { EventStatus } from "./event.types";

export const statusLabels: Record<EventStatus, string> = {
  draft: "Draft",
  scheduled: "Terjadwal",
  ongoing: "Berlangsung",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};
