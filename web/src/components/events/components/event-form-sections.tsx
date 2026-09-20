import { Plus, Trash2 } from "lucide-react";

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
import type { BoothRecord } from "@/features/booths/booth.types";
import type {
  EventConfigurationOptions,
  EventFormErrors,
  EventFormState,
  EventRecord,
  EventStatus,
  PrintOptionErrors,
  PrintOptionField,
} from "@/features/events/event.types";
import { filterPreviewStyle } from "@/features/filters/filter-preview";
import { ConfigurationSelect } from "./configuration-select";
import { OptionChecklist } from "./option-checklist";

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
              onValueChange={(value) =>
                value !== null && onChangeBooth(value)
              }
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
  form,
  errors,
  options,
  onSetOptionsRetryKey,
  onUpdateField,
}: {
  readonly form: EventFormState;
  readonly errors: EventFormErrors;
  readonly options: EventConfigurationOptions;
  readonly onSetOptionsRetryKey: (updater: (prev: number) => number) => void;
  readonly onUpdateField: <Field extends keyof EventFormState>(
    field: Field,
    value: EventFormState[Field],
  ) => void;
}) {
  return (
    <section className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold">Konfigurasi</h2>
        <p className="text-xs text-muted-foreground">
          Frame dan Filter bisa dipilih lebih dari satu. Camera dan
          Printer berlaku per Booth.
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <OptionChecklist
          noun="Frame"
          hint="Kartu memakai PNG Frame asli."
          options={options.templates}
          values={form.template_ids}
          error={errors.template_ids}
          onChange={(values) => onUpdateField("template_ids", values)}
          onExpired={() => onSetOptionsRetryKey((value) => value + 1)}
        />
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
    </section>
  );
}

export function PricingSection({
  event,
  form,
  errors,
  onUpdateField,
}: {
  readonly event: EventRecord | null;
  readonly form: EventFormState;
  readonly errors: EventFormErrors;
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
          Harga sesi, batas cetak, dan status Event.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="event-price">Harga</Label>
          <Input
            id="event-price"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            aria-invalid={Boolean(errors.price)}
            onChange={(inputEvent) =>
              onUpdateField("price", inputEvent.target.value)
            }
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price}</p>
          )}
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
            className="grid gap-3 rounded-md border p-3 sm:grid-cols-[0.8fr_1fr_1fr_1.25fr_auto] sm:items-start"
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
                <p className="text-xs text-destructive">
                  {rowErrors.price}
                </p>
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
