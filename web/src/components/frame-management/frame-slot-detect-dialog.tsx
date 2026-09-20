import { Check } from "lucide-react";
import { useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DetectedSlot } from "@/features/templates/slot-detection";
import { shotColor } from "@/features/templates/shot-colors";
import { cn } from "@/lib/utils";

/** Jumlah foto berbeda yang ditawarkan; dibatasi supaya pilihannya tetap sedikit. */
const MAX_SHOT_OPTIONS = 6;

interface FrameSlotDetectDialogProps {
  imageUrl: string;
  canvas: { width: number; height: number };
  slots: ReadonlyArray<DetectedSlot>;
  /** Jumlah slot yang sudah ada dan akan digantikan. */
  replacedCount: number;
  onCancel: () => void;
  onApply: (shotCount: number) => void;
}

interface VariantPreviewProps {
  imageUrl: string;
  canvas: { width: number; height: number };
  slots: ReadonlyArray<DetectedSlot>;
  shotCount: number;
}

function VariantPreview({
  imageUrl,
  canvas,
  slots,
  shotCount,
}: VariantPreviewProps): ReactElement {
  return (
    <div
      className="relative w-full overflow-hidden rounded border bg-white"
      style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}
    >
      {slots.map((slot, index) => {
        const shot = (index % shotCount) + 1;
        return (
          <span
            key={`${slot.x}-${slot.y}`}
            className="absolute grid place-items-center text-[11px] font-bold text-white"
            style={{
              left: `${(slot.x / canvas.width) * 100}%`,
              top: `${(slot.y / canvas.height) * 100}%`,
              width: `${(slot.width / canvas.width) * 100}%`,
              height: `${(slot.height / canvas.height) * 100}%`,
              backgroundColor: shotColor(shot),
            }}
          >
            {shot}
          </span>
        );
      })}
      <img
        src={imageUrl}
        alt=""
        className="pointer-events-none absolute inset-0 size-full object-contain"
      />
    </div>
  );
}

/**
 * Hasil deteksi ditawarkan sebagai beberapa pola jumlah foto, bukan langsung
 * diterapkan, supaya salah baca PNG bisa dibatalkan sebelum menimpa slot lama.
 */
export function FrameSlotDetectDialog({
  imageUrl,
  canvas,
  slots,
  replacedCount,
  onCancel,
  onApply,
}: FrameSlotDetectDialogProps): ReactElement {
  const [shotCount, setShotCount] = useState(1);
  const limit = Math.min(slots.length, MAX_SHOT_OPTIONS);
  const options = Array.from({ length: limit }, (_, index) => index + 1);
  if (slots.length > limit) options.push(slots.length);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Kotak Foto Terdeteksi</DialogTitle>
          <DialogDescription>
            {slots.length} kotak ditemukan pada PNG ini. Berapa foto berbeda
            untuk mengisinya?
            {replacedCount > 0
              ? ` ${replacedCount} slot yang ada akan digantikan.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-3">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={shotCount === option}
              onClick={() => setShotCount(option)}
              className={cn(
                "grid gap-2 rounded-lg border p-2 text-left",
                shotCount === option
                  ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                  : "hover:border-primary/40",
              )}
            >
              <VariantPreview
                imageUrl={imageUrl}
                canvas={canvas}
                slots={slots}
                shotCount={option}
              />
              <span className="flex items-center justify-between gap-2 text-sm font-medium">
                {option} foto
                {shotCount === option && (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                )}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Foto diambil berurutan mengikuti nomor pada pratinjau. Slot yang
          bernomor sama memakai hasil jepretan yang sama, dan tiap slot masih
          bisa diubah manual setelah diterapkan.
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="button" onClick={() => onApply(shotCount)}>
            Terapkan {slots.length} slot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
