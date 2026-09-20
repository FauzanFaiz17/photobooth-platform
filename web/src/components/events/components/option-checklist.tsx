import { Checkbox } from "@/components/ui/checkbox";
import type { EventConfigurationOption } from "@/features/events/event.types";
import { OptionCard } from "./option-card";

export function OptionChecklist({
  noun,
  hint,
  options,
  values,
  error,
  previewStyle,
  onChange,
  onExpired,
}: {
  readonly noun: string;
  readonly hint: string;
  readonly options: ReadonlyArray<EventConfigurationOption>;
  readonly values: ReadonlyArray<string>;
  readonly error?: string;
  readonly previewStyle?: (option: EventConfigurationOption) => string;
  readonly onChange: (values: ReadonlyArray<string>) => void;
  readonly onExpired: () => void;
}) {
  function toggle(value: string, checked: boolean) {
    onChange(
      checked ? [...values, value] : values.filter((item) => item !== value),
    );
  }

  const allSelected = options.length > 0 && values.length === options.length;
  const partiallySelected = values.length > 0 && !allSelected;

  return (
    <fieldset
      className="grid min-w-0 content-start gap-3 rounded-xl border p-3"
      aria-label={noun}
      aria-invalid={Boolean(error)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{noun}</h3>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs font-medium">
          <Checkbox
            checked={allSelected}
            indeterminate={partiallySelected}
            onCheckedChange={(checked) =>
              onChange(
                checked ? options.map((option) => String(option.id)) : [],
              )
            }
          />
          <span>Pilih semua ({options.length})</span>
        </label>
      </div>

      {options.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Belum ada {noun.toLowerCase()} yang aktif.
        </p>
      ) : (
        <div className="grid max-h-120 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {options.map((option) => {
            const value = String(option.id);
            const selected = values.includes(value);
            return (
              <OptionCard
                key={`${option.id}-${option.image_url ?? "none"}`}
                option={option}
                selected={selected}
                isDefault={values[0] === value}
                previewStyle={previewStyle?.(option)}
                onToggle={() => toggle(value, !selected)}
                onExpired={onExpired}
              />
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Pilihan pertama menjadi {noun} default.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}
