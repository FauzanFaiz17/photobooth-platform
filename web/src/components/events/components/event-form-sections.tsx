import { Plus, Trash2, Frame as FrameIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { BoothRecord } from "@/features/booths/booth.types";
import type {
  EventConfigurationOptions,
  EventFormErrors,
  EventFormState,
  EventRecord,
  EventStatus,
  PaymentMode,
  PrintOptionErrors,
  PrintOptionField,
} from "@/features/events/event.types";
import {
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
} from "@/features/events/event.types";
import { filterPreviewStyle } from "@/features/filters/filter-preview";
import { cn } from "@/lib/utils";
import { ConfigurationSelect } from "./configuration-select";
import { OptionChecklist } from "./option-checklist";

const CHECKERBOARD = {
  backgroundImage:
    "repeating-conic-gradient(rgba(0,0,0,0.06) 0% 25%, transparent 0% 50%)",
  backgroundSize: "16px 16px",
} as const;

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

export function ConfigurationSection({
  event,
  form,
  errors,
  options,
  onSetOptionsRetryKey,
  onUpdateField,
}: {
  readonly event: EventRecord | null;
  readonly form: EventFormState;
  readonly errors: EventFormErrors;
  readonly options: EventConfigurationOptions;
  readonly onSetOptionsRetryKey: (updater: (prev: number) => number) => void;
  readonly onUpdateField: <Field extends keyof EventFormState>(
    field: Field,
    value: EventFormState[Field],
  ) => void;
}) {
  const editing = event !== null;

  return (
    <section className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold">Konfigurasi</h2>
        <p className="text-xs text-muted-foreground">
          {editing
            ? "Ubah Frame Photo dan Filter untuk event ini. Camera dan Printer tidak dapat diubah setelah event dibuat."
            : "Frame dan Filter bisa dipilih lebih dari satu. Camera dan Printer berlaku per Booth."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <OptionChecklist
          noun="Frame"
          hint="Kartu memakai PNG Frame asli."
          options={options.templates}
          values={form.template_ids}
          error={errors.template_ids}
          onChange={(values) => onUpdateField("template_ids", values)}
          onExpired={() => onSetOptionsRetryKey((value) => value + 1)}
          className="h-124"
        />

        <div className="w-full">
          <OptionChecklist
            noun="Filter"
            hint="Pratinjau memakai rumus warna yang sama dengan aplikasi desktop."
            options={options.filters}
            values={form.filter_ids}
            error={errors.filter_ids}
            previewStyle={(option) =>
              filterPreviewStyle({
                brightness: option.brightness ?? 0,
                contrast: option.contrast ?? 0,
                saturation: option.saturation ?? 0,
                intensity: option.intensity ?? 100,
              })
            }
            onChange={(values) => onUpdateField("filter_ids", values)}
            onExpired={() => onSetOptionsRetryKey((value) => value + 1)}
          />
        </div>
      </div>

      {!editing && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ConfigurationSelect
              id="event-camera"
              label="Camera Profile"
              value={form.camera_profile_id}
              options={options.cameras}
              error={errors.camera_profile_id}
              onChange={(value) => onUpdateField("camera_profile_id", value)}
            />
            <ConfigurationSelect
              id="event-printer"
              label="Printer Profile"
              value={form.printer_profile_id}
              options={options.printers}
              error={errors.printer_profile_id}
              onChange={(value) => onUpdateField("printer_profile_id", value)}
            />
          </div>
        </>
      )}
    </section>
  );
}

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

export function PrintOptionsSection({
  form,
  printOptionErrors,
  onAddPrintOption,
  onUpdatePrintOption,
  onRemovePrintOption,
}: {
  readonly form: EventFormState;
  readonly printOptionErrors: PrintOptionErrors;
  readonly onAddPrintOption: () => void;
  readonly onUpdatePrintOption: (
    id: number,
    field: PrintOptionField,
    value: string,
  ) => void;
  readonly onRemovePrintOption: (id: number) => void;
}) {
  return (
    <section className="grid gap-3 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Paket cetak</h2>
          <p className="text-xs text-muted-foreground">
            Atur pilihan jumlah dan harga cetak untuk pelanggan.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddPrintOption}
        >
          <Plus aria-hidden="true" /> Tambah paket
        </Button>
      </div>

      {form.print_options.length === 0 && (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Belum ada paket cetak.
        </p>
      )}

      {form.print_options.map((option, index) => {
        const rowErrors = printOptionErrors[option.id];
        return (
          <div
            key={option.id}
            className="grid gap-3 rounded-md border p-3 sm:grid-cols-[0.8fr_1fr_1fr_1.25fr_1fr_auto] sm:items-start"
          >
            <div className="grid gap-2">
              <Label htmlFor={`print-paper-${option.id}`}>Ukuran</Label>
              <Select<"2r" | "4r">
                value={option.paper_size}
                onValueChange={(value) =>
                  value !== null &&
                  onUpdatePrintOption(option.id, "paper_size", value)
                }
              >
                <SelectTrigger
                  id={`print-paper-${option.id}`}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2r">2R</SelectItem>
                  <SelectItem value="4r">4R</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`print-quantity-${option.id}`}>
                Jumlah dasar
              </Label>
              <Input
                id={`print-quantity-${option.id}`}
                type="number"
                min={1}
                step={1}
                value={option.unit_quantity}
                aria-invalid={Boolean(rowErrors?.unit_quantity)}
                onChange={(inputEvent) =>
                  onUpdatePrintOption(
                    option.id,
                    "unit_quantity",
                    inputEvent.target.value,
                  )
                }
              />
              {rowErrors?.unit_quantity && (
                <p className="text-xs text-destructive">
                  {rowErrors.unit_quantity}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`print-step-${option.id}`}>Kelipatan</Label>
              <Input
                id={`print-step-${option.id}`}
                type="number"
                min={1}
                step={1}
                value={option.quantity_step}
                aria-invalid={Boolean(rowErrors?.quantity_step)}
                onChange={(inputEvent) =>
                  onUpdatePrintOption(
                    option.id,
                    "quantity_step",
                    inputEvent.target.value,
                  )
                }
              />
              {rowErrors?.quantity_step && (
                <p className="text-xs text-destructive">
                  {rowErrors.quantity_step}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`print-price-${option.id}`}>Harga</Label>
              <Input
                id={`print-price-${option.id}`}
                type="number"
                min={0}
                step="0.01"
                value={option.price}
                aria-invalid={Boolean(rowErrors?.price)}
                onChange={(inputEvent) =>
                  onUpdatePrintOption(
                    option.id,
                    "price",
                    inputEvent.target.value,
                  )
                }
              />
              {rowErrors?.price && (
                <p className="text-xs text-destructive">{rowErrors.price}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`print-discount-${option.id}`}>Diskon</Label>
              <Input
                id={`print-discount-${option.id}`}
                type="number"
                min={0}
                step="0.01"
                value={option.discount}
                aria-invalid={Boolean(rowErrors?.discount)}
                onChange={(inputEvent) =>
                  onUpdatePrintOption(
                    option.id,
                    "discount",
                    inputEvent.target.value,
                  )
                }
              />
              {rowErrors?.discount && (
                <p className="text-xs text-destructive">{rowErrors.discount}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="sm:mt-6"
              aria-label={`Hapus paket cetak ${index + 1}`}
              title="Hapus paket"
              onClick={() => onRemovePrintOption(option.id)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        );
      })}
    </section>
  );
}
