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
import type { EventFormState, PrintOptionErrors, PrintOptionField } from "@/features/events/event.types";
import { Plus, Trash2 } from "lucide-react";

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