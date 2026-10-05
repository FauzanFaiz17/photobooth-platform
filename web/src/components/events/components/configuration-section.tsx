import type { EventConfigurationOptions, EventFormErrors, EventFormState, EventRecord } from "@/features/events/event.types";
import { OptionChecklist } from "./option-checklist";
import { filterPreviewStyle } from "@/features/filters/filter-preview";
import { ConfigurationSelect } from "./configuration-select";

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
