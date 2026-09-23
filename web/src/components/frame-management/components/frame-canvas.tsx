import type { FrameCanvasProps, SlotRect } from "@/features/templates/template.types";
import { QR_SLOT_ID } from "@/features/templates/template.types";
import { Canvas, FabricImage, Rect } from "fabric";
import { useEffect, useRef, type ReactElement } from "react";
import { clamp, isSlotRect } from "../utils";
import { shotColor } from "@/features/templates/shot-colors";

export default function FrameCanvas({
  canvasWidth,
  canvasHeight,
  displayWidth,
  displayHeight,
  overlayUrl,
  slotsInFront,
  slots,
  qr,
  selectedSlotId,
  onSelect,
  onChange,
  onQrChange,
  onOverlayError,
}: FrameCanvasProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const overlayRef = useRef<FabricImage | null>(null);
  const callbacksRef = useRef({ onSelect, onChange, onQrChange, onOverlayError });

  /** Slot digambar sebagai object biasa, jadi urutannya relatif terhadap overlay bisa dibalik. */
  function applyOverlayOrder(canvas: Canvas, inFront: boolean) {
    const overlay = overlayRef.current;
    if (!overlay) return;
    if (inFront) canvas.sendObjectToBack(overlay);
    else canvas.bringObjectToFront(overlay);
  }

  useEffect(() => {
    callbacksRef.current = { onSelect, onChange, onQrChange, onOverlayError };
  }, [onChange, onOverlayError, onQrChange, onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const element = document.createElement("canvas");
    container.replaceChildren(element);
    const canvas = new Canvas(element, {
      width: canvasWidth,
      height: canvasHeight,
      selection: false,
    });
    canvas.setDimensions(
      { width: `${displayWidth}px`, height: `${displayHeight}px` },
      { cssOnly: true },
    );
    fabricRef.current = canvas;

    canvas.on("selection:created", ({ selected }) =>
      callbacksRef.current.onSelect(
        (selected?.[0] as SlotRect | undefined)?.slotId ?? null,
      ),
    );
    canvas.on("selection:updated", ({ selected }) =>
      callbacksRef.current.onSelect(
        (selected?.[0] as SlotRect | undefined)?.slotId ?? null,
      ),
    );
    canvas.on("selection:cleared", () => callbacksRef.current.onSelect(null));
    canvas.on("object:moving", ({ target }) => {
      const object = target as SlotRect;
      const objectWidth = object.width * object.scaleX;
      const objectHeight = object.height * object.scaleY;
      object.set({
        left: clamp(
          object.left ?? 0,
          0,
          Math.max(0, canvasWidth - objectWidth),
        ),
        top: clamp(
          object.top ?? 0,
          0,
          Math.max(0, canvasHeight - objectHeight),
        ),
      });
    });
    canvas.on("object:modified", ({ target }) => {
      const object = target as SlotRect;
      const left = clamp(object.left ?? 0, 0, Math.max(0, canvasWidth - 10));
      const top = clamp(object.top ?? 0, 0, Math.max(0, canvasHeight - 10));
      const objectWidth = clamp(
        object.width * object.scaleX,
        10,
        canvasWidth - left,
      );
      const objectHeight = clamp(
        object.height * object.scaleY,
        10,
        canvasHeight - top,
      );
      object.set({
        left,
        top,
        width: objectWidth,
        height: objectHeight,
        scaleX: 1,
        scaleY: 1,
      });
      object.setCoords();
      if (object.slotId === QR_SLOT_ID) {
        callbacksRef.current.onQrChange({
          x: left,
          y: top,
          width: objectWidth,
          height: objectHeight,
        });
      } else {
        callbacksRef.current.onChange(object.slotId, {
          x: left,
          y: top,
          width: objectWidth,
          height: objectHeight,
        });
      }
    });

    return () => {
      fabricRef.current = null;
      overlayRef.current = null;
      void canvas.dispose().catch(() => undefined);
      element.remove();
    };
  }, [canvasHeight, canvasWidth, displayHeight, displayWidth]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    let cancelled = false;
    const previous = overlayRef.current;
    if (previous) {
      canvas.remove(previous);
      overlayRef.current = null;
    }
    if (!overlayUrl) {
      canvas.requestRenderAll();
      return;
    }

    void FabricImage.fromURL(overlayUrl, { crossOrigin: "anonymous" })
      .then((image) => {
        if (cancelled || fabricRef.current !== canvas) return;
        image.set({
          left: 0,
          top: 0,
          originX: "left",
          originY: "top",
          selectable: false,
          evented: false,
          scaleX: canvasWidth / (image.width || canvasWidth),
          scaleY: canvasHeight / (image.height || canvasHeight),
        });
        overlayRef.current = image;
        canvas.add(image);
        applyOverlayOrder(canvas, slotsInFront);
        canvas.requestRenderAll();
      })
      .catch(() => {
        if (!cancelled) callbacksRef.current.onOverlayError();
      });

    return () => {
      cancelled = true;
    };
    // slotsInFront sengaja tidak jadi dependency: perubahannya ditangani efek urutan di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasHeight, canvasWidth, overlayUrl]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    applyOverlayOrder(canvas, slotsInFront);
    canvas.requestRenderAll();
  }, [overlayUrl, slotsInFront]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const visualScale = canvasWidth / displayWidth;
    const current = new Map(
      canvas
        .getObjects()
        .filter(isSlotRect)
        .map((object) => [object.slotId, object]),
    );

    slots.forEach((slot) => {
      const values = {
        left: slot.x,
        top: slot.y,
        width: slot.width,
        height: slot.height,
        // Slot diwarnai per nomor foto supaya sebaran "1, 2, 3" langsung terbaca.
        fill: shotColor(slot.shot),
        stroke: "rgba(15, 23, 42, 0.35)",
      };
      const existing = current.get(slot.id);
      if (existing) {
        existing.set({
          ...values,
          originX: "left",
          originY: "top",
          scaleX: 1,
          scaleY: 1,
        });
        existing.setCoords();
        current.delete(slot.id);
      } else {
        const object = new Rect({
          ...values,
          originX: "left",
          originY: "top",
          strokeWidth: 2 * visualScale,
          cornerColor: "#ffffff",
          cornerStrokeColor: "#2563eb",
          borderColor: "#2563eb",
          transparentCorners: false,
          cornerSize: 12 * visualScale,
          borderScaleFactor: 2,
          padding: 2 * visualScale,
          strokeUniform: true,
          lockScalingFlip: true,
          lockRotation: true,
        }) as SlotRect;
        object.slotId = slot.id;
        object.setControlsVisibility({ mtr: false });
        canvas.add(object);
      }
    });

    const preservedQr = current.get(QR_SLOT_ID);
    current.delete(QR_SLOT_ID);
    current.forEach((object) => canvas.remove(object));

    // QR digambar terpisah di atas overlay (urutan diatur applyOverlayOrder).
    const qrObject = preservedQr ?? canvas
      .getObjects()
      .filter(isSlotRect)
      .find((object) => object.slotId === QR_SLOT_ID) ?? null;
    if (qr) {
      const qrValues = {
        left: qr.x,
        top: qr.y,
        width: qr.width,
        height: qr.height,
        fill: "rgba(15, 23, 42, 0.85)",
        stroke: "#2563eb",
      };
      if (qrObject) {
        qrObject.set({
          ...qrValues,
          originX: "left",
          originY: "top",
          scaleX: 1,
          scaleY: 1,
        });
        qrObject.setCoords();
      } else {
        const object = new Rect({
          ...qrValues,
          originX: "left",
          originY: "top",
          strokeWidth: 2 * visualScale,
          cornerColor: "#ffffff",
          cornerStrokeColor: "#2563eb",
          borderColor: "#2563eb",
          transparentCorners: false,
          cornerSize: 12 * visualScale,
          borderScaleFactor: 2,
          padding: 2 * visualScale,
          strokeUniform: true,
          lockScalingFlip: true,
          lockRotation: true,
        }) as SlotRect;
        object.slotId = QR_SLOT_ID;
        object.setControlsVisibility({ mtr: false });
        canvas.add(object);
      }
    } else if (qrObject) {
      canvas.remove(qrObject);
    }

    applyOverlayOrder(canvas, slotsInFront);
    // QR selalu di atas overlay PNG.
    if (qr) {
      const qrFront = canvas
        .getObjects()
        .filter(isSlotRect)
        .find((object) => object.slotId === QR_SLOT_ID);
      if (qrFront) canvas.bringObjectToFront(qrFront);
    }
    const selected = canvas
      .getObjects()
      .filter(isSlotRect)
      .find((object) => object.slotId === selectedSlotId);
    if (selected && canvas.getActiveObject() !== selected)
      canvas.setActiveObject(selected);
    if (!selected && canvas.getActiveObject()) canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [
    canvasHeight,
    canvasWidth,
    displayWidth,
    qr,
    selectedSlotId,
    slots,
    slotsInFront,
  ]);

  return (
    <div
      role="application"
      aria-label="Editor slot foto"
      className="relative overflow-hidden bg-transparent [&_.canvas-container]:shadow-2xl"
      style={{ width: displayWidth, height: displayHeight }}
    >
      <div ref={containerRef} className="size-full" />
      {slots.map((slot) => (
        <span
          key={slot.id}
          className="pointer-events-none absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full px-2 py-1 text-sm font-bold text-white ring-2 ring-white/70"
          style={{
            left: `${((slot.x + slot.width / 2) / canvasWidth) * 100}%`,
            top: `${((slot.y + slot.height / 2) / canvasHeight) * 100}%`,
            backgroundColor: shotColor(slot.shot),
          }}
        >
          {slot.shot}
        </span>
      ))}
      {qr && (
        <span
          className="pointer-events-none absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded px-2 py-1 text-xs font-black uppercase tracking-wider text-white ring-2 ring-white/70"
          style={{
            left: `${((qr.x + qr.width / 2) / canvasWidth) * 100}%`,
            top: `${((qr.y + qr.height / 2) / canvasHeight) * 100}%`,
            backgroundColor: "#0f172a",
          }}
        >
          QR
        </span>
      )}
    </div>
  );
}