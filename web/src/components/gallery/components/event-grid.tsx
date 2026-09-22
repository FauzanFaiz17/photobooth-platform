import { Images } from "lucide-react";
import { EmptyState } from "./empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EventGrid({
  eventGroups,
  galleries,
  events,
  onSelect,
}: {
  readonly eventGroups: ReadonlyArray<number>;
  readonly galleries: ReadonlyArray<{ event_id: number | null }>;
  readonly events: ReadonlyArray<{ id: number; event_name?: string; event_code?: string }>;
  readonly onSelect: (id: number) => void;
}) {
  if (eventGroups.length === 0) {
    return <EmptyState icon={Images} title="Belum ada Event Gallery" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {eventGroups.map((eventId) => {
        const event = events.find((e) => e.id === eventId);
        const count = galleries.filter((g) => g.event_id === eventId).length;
        return (
          <Card
            key={eventId}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => onSelect(eventId)}
          >
            <CardHeader>
              <CardTitle>{event?.event_name ?? `Event #${eventId}`}</CardTitle>
              <CardDescription>{event?.event_code ?? "Event"}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {count} sesi gallery
              </p>
              <Button
                className="mt-3 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(eventId);
                }}
              >
                <Images aria-hidden="true" /> Lihat Foto
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}