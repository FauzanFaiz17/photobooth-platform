import {
  Copy,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SLOT_RATIOS,
  type PhotoSlot,
  type SlotRatio,
} from "@/features/templates/template.types";

interface FrameSlotEditorCardProps {
  selectedSlot: PhotoSlot | null;
  slots: ReadonlyArray<PhotoSlot>;
  selectedRatio: SlotRatio | null;
  canvasSize: { width: number; height: number };
  duplicateSlot: (slot: PhotoSlot) => void;
  removeSlot: (slotId: number) => void;
  applySlotRatio: (ratio: SlotRatio) => void;
  changeSlotNumber: (
    field: "shot" | "x" | "y" | "width" | "height",
    value: string,
  ) => void;
}

export function FrameSlotEditorCard({
  selectedSlot,
  slots,
  selectedRatio,
  canvasSize,
  duplicateSlot,
  removeSlot,
  applySlotRatio,
  changeSlotNumber,
}: FrameSlotEditorCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Slot Foto</CardTitle>
            <CardDescription>
              {slots.length} slot ·{" "}
              {new Set(slots.map((slot) => slot.shot)).size} foto
            </CardDescription>
          </div>
          {selectedSlot && (
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Duplikat slot terpilih"
                title="Duplikat slot (ukuran sama)"
                onClick={() => duplicateSlot(selectedSlot)}
              >
                <Copy aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                aria-label="Hapus slot terpilih"
                onClick={() => removeSlot(selectedSlot.id)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!selectedSlot && (
          <p className="text-sm text-muted-foreground">
            Pilih slot pada canvas untuk mengatur ukuran dan posisinya.
          </p>
        )}
        {selectedSlot && (
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Rasio slot</Label>
              <div className="flex rounded-md border p-1">
                {(Object.keys(SLOT_RATIOS) as SlotRatio[]).map((ratio) => (
                  <Button
                    key={ratio}
                    type="button"
                    size="sm"
                    variant={selectedRatio === ratio ? "secondary" : "ghost"}
                    className="flex-1"
                    title={`Ukuran awal ${SLOT_RATIOS[ratio].label}`}
                    onClick={() => applySlotRatio(ratio)}
                  >
                    {ratio === "1:1" ? (
                      <Square aria-hidden="true" />
                    ) : ratio === "2:3" ? (
                      <RectangleVertical aria-hidden="true" />
                    ) : (
                      <RectangleHorizontal aria-hidden="true" />
                    )}{" "}
                    {ratio}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Menyusun ukuran awal slot. Setelah itu tetap bisa ditarik
                bebas.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["shot", "x", "y", "width", "height"] as const).map((field) => (
                <div key={field} className="grid gap-2">
                  <Label htmlFor={`slot-${field}`}>
                    {field === "shot"
                      ? "Foto ke"
                      : field === "x"
                        ? "Posisi X (px)"
                        : field === "y"
                          ? "Posisi Y (px)"
                          : field === "width"
                            ? "Lebar (px)"
                            : "Tinggi (px)"}
                  </Label>
                  <Input
                    id={`slot-${field}`}
                    type="number"
                    min={
                      field === "shot"
                        ? 1
                        : field === "x" || field === "y"
                          ? 0
                          : 10
                    }
                    max={
                      field === "shot"
                        ? undefined
                        : field === "x"
                          ? canvasSize.width - selectedSlot.width
                          : field === "y"
                            ? canvasSize.height - selectedSlot.height
                            : field === "width"
                              ? canvasSize.width - selectedSlot.x
                              : canvasSize.height - selectedSlot.y
                    }
                    step={1}
                    value={Math.round(selectedSlot[field])}
                    onChange={(event) =>
                      changeSlotNumber(field, event.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
