import { ImageUp, LoaderCircle, Plus, Sparkles } from "lucide-react";

import samplePhoto from "@/assets/preview.webp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { shotColor } from "@/features/templates/shot-colors";
import type {
  FormErrors,
  PhotoSlot,
  QrRect,
} from "@/features/templates/template.types";
import { cn } from "@/lib/utils";
import FrameCanvas from "./frame-canvas";

export interface FrameCanvasAreaProps {
  mode: "edit" | "preview";
  canvasDark: boolean;
  canvasSize: { width: number; height: number };
  displayWidth: number;
  displayHeight: number;
  slots: ReadonlyArray<PhotoSlot>;
  qr: QrRect | null;
  selectedSlotId: number | null;
  overlayUrl: string | null;
  overlayBroken: boolean;
  slotsInFront: boolean;
  detecting: boolean;
  canvasAreaRef: React.RefObject<HTMLDivElement | null>;
  overlayInputRef: React.RefObject<HTMLInputElement | null>;
  errors: FormErrors;
  setSelectedSlotId: (id: number | null) => void;
  updateSlot: (slotId: number, updates: Partial<Omit<PhotoSlot, "id">>) => void;
  updateQr: (updates: Partial<QrRect>) => void;
  setOverlayBroken: (broken: boolean) => void;
  detectFromCurrent: () => void;
  addSlot: () => void;
}

export function FrameCanvasArea({
  mode,
  canvasDark,
  canvasSize,
  displayWidth,
  displayHeight,
  slots,
  qr,
  selectedSlotId,
  overlayUrl,
  overlayBroken,
  slotsInFront,
  detecting,
  canvasAreaRef,
  overlayInputRef,
  errors,
  setSelectedSlotId,
  updateSlot,
  updateQr,
  setOverlayBroken,
  detectFromCurrent,
  addSlot,
}: FrameCanvasAreaProps) {
  const { width: canvasWidth, height: canvasHeight } = canvasSize;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden max-lg:h-[70vh]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{canvasSize.width}x{canvasSize.height}</Badge>
          <span className="text-xs text-muted-foreground">
            {canvasSize.width} x {canvasSize.height} px · {slots.length} slot
            foto
            {selectedSlotId && mode === "edit"
              ? " · geser dengan tombol panah (Shift = 10 px)"
              : ""}
          </span>
        </div>
        {mode === "edit" && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!overlayUrl || detecting}
              title={
                overlayUrl
                  ? "Cari slot foto dari area transparan PNG"
                  : "Unggah PNG frame dulu"
              }
              onClick={() => void detectFromCurrent()}
            >
              {detecting ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles aria-hidden="true" />
              )}{" "}
              Auto deteksi
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={addSlot}
              disabled={!overlayUrl}
              title={overlayUrl ? undefined : "Unggah PNG frame dulu"}
            >
              <Plus aria-hidden="true" /> Tambah Foto
            </Button>
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-zinc-100 p-6 dark:bg-zinc-950">
        <div
          ref={canvasAreaRef}
          className="grid min-h-full w-full place-items-center"
        >
          {mode === "edit" ? (
            <div
              className={cn(
                "relative overflow-hidden rounded-sm border-8 shadow-2xl ring-1 ring-black/10",
                canvasDark
                  ? "bg-black border-black"
                  : "bg-white border-white",
              )}
            >
              <FrameCanvas
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                displayWidth={displayWidth}
                displayHeight={displayHeight}
                overlayUrl={overlayUrl}
                slotsInFront={slotsInFront}
                slots={slots}
                qr={qr}
                selectedSlotId={selectedSlotId}
                onSelect={setSelectedSlotId}
                onChange={updateSlot}
                onQrChange={updateQr}
                onOverlayError={() => setOverlayBroken(true)}
              />
              {(!overlayUrl || overlayBroken) && (
                <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-3">
                  <button
                    type="button"
                    onClick={() => overlayInputRef.current?.click()}
                    className="pointer-events-auto grid max-w-[90%] gap-1 rounded-md border-2 border-dashed border-muted-foreground/40 bg-white/90 px-5 py-3 text-center transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <ImageUp
                      className="mx-auto size-8 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="font-medium">
                      {overlayBroken
                        ? "PNG tidak bisa dimuat"
                        : "Unggah Image PNG"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {overlayBroken
                        ? "Klik untuk mengunggah ulang PNG. Slot tetap bisa diedit."
                        : "Klik untuk memilih PNG frame."}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "overflow-hidden rounded-sm border-8 border-white shadow-2xl ring-1 ring-black/10",
                canvasDark ? "bg-black border-black" : "bg-white",
              )}
            >
              <div
                className={cn(
                  "relative overflow-hidden",
                  canvasDark ? "bg-black" : "bg-white",
                )}
                style={{ width: displayWidth, height: displayHeight }}
              >
                {slots.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="absolute overflow-hidden bg-muted ring-1 ring-black/10"
                    style={{
                      left: `${(slot.x / canvasWidth) * 100}%`,
                      top: `${(slot.y / canvasHeight) * 100}%`,
                      width: `${(slot.width / canvasWidth) * 100}%`,
                      height: `${(slot.height / canvasHeight) * 100}%`,
                      zIndex: slotsInFront ? 2 : 1,
                    }}
                  >
                    <img
                      src={samplePhoto}
                      alt={`Contoh foto ${index + 1}`}
                      className="size-full object-cover"
                      style={{
                        objectPosition:
                          index % 2 === 0 ? "center 25%" : "center 65%",
                      }}
                    />
                    <span
                      className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: shotColor(slot.shot) }}
                    >
                      {slot.shot}
                    </span>
                  </div>
                ))}
                {overlayUrl && !overlayBroken && (
                  <img
                    src={overlayUrl}
                    alt="PNG frame"
                    className="pointer-events-none absolute inset-0 size-full object-contain"
                    style={{ zIndex: slotsInFront ? 1 : 2 }}
                  />
                )}
                {qr && (
                  <div
                    className="pointer-events-none absolute grid place-items-center border-2 border-dashed border-slate-700 bg-slate-900/80 text-xs font-black uppercase text-white"
                    style={{
                      left: `${(qr.x / canvasWidth) * 100}%`,
                      top: `${(qr.y / canvasHeight) * 100}%`,
                      width: `${(qr.width / canvasWidth) * 100}%`,
                      height: `${(qr.height / canvasHeight) * 100}%`,
                      zIndex: 3,
                    }}
                  >
                    QR
                  </div>
                )}
                {slots.length === 0 && (
                  <div className="absolute inset-0 grid place-items-center p-6 text-center">
                    <div>
                      <p className="font-medium text-muted-foreground">
                        Canvas {canvasSize.width} x {canvasSize.height}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {overlayUrl
                          ? "Klik Tambah Foto untuk membuat slot."
                          : "Unggah PNG frame di mode Edit."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {errors.slots && (
        <p className="shrink-0 border-t bg-background px-3 py-2 text-sm text-destructive">
          {errors.slots}
        </p>
      )}
    </section>
  );
}
