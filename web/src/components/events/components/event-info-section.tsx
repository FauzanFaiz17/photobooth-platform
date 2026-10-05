import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BoothRecord } from "@/features/booths/booth.types";
import type {
  EventFormErrors,
  EventFormState,
  EventRecord,
} from "@/features/events/event.types";

export function EventInfoSection({
  event,
  form,
  errors,
  booths,
  onUpdateField,
  onChangeBooth,
}: {
  readonly event: EventRecord | null;
  readonly form: EventFormState;
  readonly errors: EventFormErrors;
  readonly booths: ReadonlyArray<BoothRecord>;
  readonly onUpdateField: <Field extends keyof EventFormState>(
    field: Field,
    value: EventFormState[Field],
  ) => void;
  readonly onChangeBooth: (value: string) => void;
}) {
  return (
    <section className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold">Informasi Event</h2>
        <p className="text-xs text-muted-foreground">
          Booth, nama, dan jadwal pelaksanaan Event.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {!event && (
          <div className="grid gap-2">
            <Label htmlFor="event-booth">Booth</Label>
            <Select<string>
              value={form.booth_id || null}
              onValueChange={(value) => value !== null && onChangeBooth(value)}
            >
              <SelectTrigger
                id="event-booth"
                className="w-full"
                aria-invalid={Boolean(errors.booth_id)}
              >
                <SelectValue placeholder="Pilih Booth" />
              </SelectTrigger>
              <SelectContent>
                {booths.map((booth) => (
                  <SelectItem key={booth.id} value={String(booth.id)}>
                    {booth.name} —{" "}
                    {booth.partner.brand_name || booth.partner.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.booth_id && (
              <p className="text-xs text-destructive">{errors.booth_id}</p>
            )}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="event-name">Nama Event</Label>
          <Input
            id="event-name"
            value={form.event_name}
            maxLength={150}
            aria-invalid={Boolean(errors.event_name)}
            onChange={(inputEvent) =>
              onUpdateField("event_name", inputEvent.target.value)
            }
          />
          {errors.event_name && (
            <p className="text-xs text-destructive">{errors.event_name}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="event-date">Tanggal</Label>
          <Input
            id="event-date"
            type="date"
            value={form.event_date}
            aria-invalid={Boolean(errors.event_date)}
            onChange={(inputEvent) =>
              onUpdateField("event_date", inputEvent.target.value)
            }
          />
          {errors.event_date && (
            <p className="text-xs text-destructive">{errors.event_date}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="event-start">Jam mulai</Label>
          <Input
            id="event-start"
            type="time"
            value={form.start_time}
            aria-invalid={Boolean(errors.start_time)}
            onChange={(inputEvent) =>
              onUpdateField("start_time", inputEvent.target.value)
            }
          />
          {errors.start_time && (
            <p className="text-xs text-destructive">{errors.start_time}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="event-end">Jam selesai</Label>
          <Input
            id="event-end"
            type="time"
            value={form.end_time}
            aria-invalid={Boolean(errors.end_time)}
            onChange={(inputEvent) =>
              onUpdateField("end_time", inputEvent.target.value)
            }
          />
          {errors.end_time && (
            <p className="text-xs text-destructive">{errors.end_time}</p>
          )}
        </div>
      </div>
    </section>
  );
}
