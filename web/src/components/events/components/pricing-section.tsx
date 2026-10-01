import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PAYMENT_MODE_LABELS, PAYMENT_MODES, type EventConfigurationOptions, type EventFormErrors, type EventFormState, type EventRecord, type EventStatus, type PaymentMode } from "@/features/events/event.types";
import { CHECKERBOARD, cn } from "@/lib/utils";
import { FrameIcon } from "lucide-react";

export function PricingSection({
  event,
  form,
  errors,
  options,
  onUpdateField,
}: {
  readonly event: EventRecord | null;
  readonly form: EventFormState;
  readonly errors: EventFormErrors;
  readonly options: EventConfigurationOptions;
  readonly onUpdateField: <Field extends keyof EventFormState>(
    field: Field,
    value: EventFormState[Field],
  ) => void;
}) {
  return (
    <section className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold">Harga dan Status</h2>
        <p className="text-xs text-muted-foreground">
          Mode pembayaran, batas cetak, media, dan status Event.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="event-payment-mode">Mode Pembayaran</Label>
          <Select<PaymentMode>
            value={form.payment_mode}
            onValueChange={(value) =>
              value !== null && onUpdateField("payment_mode", value)
            }
          >
            <SelectTrigger id="event-payment-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {PAYMENT_MODE_LABELS[mode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="event-print-limit">Batas cetak</Label>
          <Input
            id="event-print-limit"
            type="number"
            min={0}
            step={1}
            value={form.print_count_limit}
            aria-invalid={Boolean(errors.print_count_limit)}
            onChange={(inputEvent) =>
              onUpdateField("print_count_limit", inputEvent.target.value)
            }
          />
          {errors.print_count_limit && (
            <p className="text-xs text-destructive">
              {errors.print_count_limit}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-md border p-3">
          <Switch
            id="event-video-enabled"
            checked={form.video_enabled}
            onCheckedChange={(checked) =>
              onUpdateField("video_enabled", checked)
            }
          />
          <Label htmlFor="event-video-enabled" className="cursor-pointer">
            Aktifkan Video
          </Label>
        </div>
        <div className="flex items-center gap-3 rounded-md border p-3">
          <Switch
            id="event-gif-enabled"
            checked={form.gif_enabled}
            onCheckedChange={(checked) => {
              onUpdateField("gif_enabled", checked);
              if (!checked) {
                onUpdateField("gif_template_id", null);
              }
            }}
          />
          <Label htmlFor="event-gif-enabled" className="cursor-pointer">
            Aktifkan GIF
          </Label>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="event-status">Status</Label>
          <Select<EventStatus>
            value={form.status}
            onValueChange={(value) =>
              value !== null && onUpdateField("status", value)
            }
          >
            <SelectTrigger id="event-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(event
                ? ([
                    "draft",
                    "scheduled",
                    "ongoing",
                    "completed",
                    "cancelled",
                  ] as const)
                : (["draft", "scheduled"] as const)
              ).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.gif_enabled && (
        <div className="grid gap-2">
          <Label>GIF Frame</Label>
          {options.gif_templates.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada Frame GIF yang aktif. Buat Frame dengan tipe GIF
              terlebih dahulu.
            </p>
          ) : (
            <div className="grid max-h-80 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {options.gif_templates.map((option) => {
                const value = String(option.id);
                const selected = form.gif_template_id === value;
                return (
                  <div
                    key={option.id}
                    role="radio"
                    aria-checked={selected}
                    aria-label={option.name}
                    tabIndex={0}
                    onClick={() =>
                      onUpdateField("gif_template_id", selected ? null : value)
                    }
                    onKeyDown={(keyEvent) => {
                      if (keyEvent.key === " " || keyEvent.key === "Enter") {
                        keyEvent.preventDefault();
                        onUpdateField(
                          "gif_template_id",
                          selected ? null : value,
                        );
                      }
                    }}
                    className={cn(
                      "group relative cursor-pointer h-full overflow-hidden rounded-lg border bg-background outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
                      selected
                        ? "border-primary ring-2 ring-primary/30"
                        : "hover:border-primary/40",
                    )}
                  >
                    <div
                      className="relative aspect-4/3 w-full overflow-hidden"
                      style={CHECKERBOARD}
                    >
                      {option.image_url ? (
                        <div className="w-full h-full flex justify-center items-center p-12">
                          <img
                          src={option.image_url}
                          alt={`Frame ${option.name}`}
                          loading="lazy"
                          className="p-20"
                        />
                          </div>
                      ) : (
                        <div className="absolute inset-0 grid place-items-center p-3">
                          <FrameIcon className="size-8 text-muted-foreground" />
                        </div>
                      )}
                      {selected && (
                        <Badge
                          className="absolute right-2 top-2"
                          variant="default"
                        >
                          Dipilih
                        </Badge>
                      )}
                      {option.is_global && (
                        <Badge
                          className="absolute left-2 top-2"
                          variant="outline"
                        >
                          Global
                        </Badge>
                      )}
                    </div>
                    <div className="flex min-w-0 items-center border-t px-3 py-2">
                      <span
                        className="min-w-0 flex-1 truncate text-sm font-medium"
                        title={option.name}
                      >
                        {option.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Pilih satu Frame untuk output GIF. Klik lagi untuk membatalkan
            pilihan.
          </p>
        </div>
      )}
    </section>
  );
}