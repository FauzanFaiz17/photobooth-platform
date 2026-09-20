import { FRAME_SIZES } from "@/constants";
import {
  SLOT_RATIOS,
  TEMPLATE_STATUSES,
  type FrameLayoutInfo,
  type FrameOrientation,
  type FrameSize,
  type LayoutSlot,
  type PhotoSlot,
  type SlotRatio,
  type SlotRect,
  type TemplatePaperSize,
  type TemplateRecord,
  type TemplateStatus,
} from "@/features/templates/template.types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

export function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function positiveInteger(value: unknown): number | null {
  const parsed = finiteNumber(value);
  return parsed !== null && parsed >= 1 ? Math.trunc(parsed) : null;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function isSlotRect(object: object): object is SlotRect {
  return typeof (object as SlotRect).slotId === "number";
}

export function frameDimensions(
  size: FrameSize,
  orientation: FrameOrientation,
): { width: number; height: number } {
  const base = FRAME_SIZES[size];
  return size === "4R" && orientation === "landscape"
    ? { width: base.height, height: base.width }
    : { width: base.width, height: base.height };
}

export function slotRatioOf(
  slot: Pick<PhotoSlot, "width" | "height">,
): SlotRatio | null {
  if (slot.height <= 0) return null;
  const ratio = slot.width / slot.height;
  const options = Object.keys(SLOT_RATIOS) as SlotRatio[];
  return (
    options.find((key) => Math.abs(ratio - SLOT_RATIOS[key].value) < 0.02) ??
    null
  );
}

/**
 * paper_size tidak dikembalikan TemplateResource, dan kedua ukuran kini punya kanvas
 * identik — jadi dimensi tidak bisa dipakai membedakan. Penanda disimpan di dalam
 * json_layout, satu-satunya bagian payload yang dijamin round-trip.
 */
export function readFrameSize(frame: TemplateRecord): FrameSize | null {
  if (frame.paper_size === "2r") return "2R";
  if (frame.paper_size === "4r") return "4R";
  if (isRecord(frame.json_layout)) {
    const stored = frame.json_layout.paper_size;
    if (stored === "2r") return "2R";
    if (stored === "4r") return "4R";
  }
  return null;
}

export function paperSizeForFrame(size: FrameSize): TemplatePaperSize {
  return size === "2R" ? "2r" : "4r";
}

export function readFrameLayout(frame: TemplateRecord): {
  size: FrameSize;
  orientation: FrameOrientation;
  slots: ReadonlyArray<PhotoSlot>;
  slotsInFront: boolean;
} {
  const preferredSize = readFrameSize(frame);
  const size = preferredSize ?? "4R";
  if (!isRecord(frame.json_layout))
    return { size, orientation: "portrait", slots: [], slotsInFront: false };
  const slotsInFront = frame.json_layout.slots_on_top === true;

  const canvas = isRecord(frame.json_layout.canvas)
    ? frame.json_layout.canvas
    : null;
  const fallback = FRAME_SIZES[size];
  const sourceWidth = positiveNumber(canvas?.width) ?? fallback.width;
  const sourceHeight = positiveNumber(canvas?.height) ?? fallback.height;
  const storedOrientation =
    frame.json_layout.orientation === "landscape"
      ? "landscape"
      : frame.json_layout.orientation === "portrait"
        ? "portrait"
        : null;
  const orientation: FrameOrientation =
    size === "2R"
      ? "portrait"
      : (storedOrientation ??
        (sourceWidth > sourceHeight ? "landscape" : "portrait"));
  const target = frameDimensions(size, orientation);
  const scaleX = target.width / sourceWidth;
  const scaleY = target.height / sourceHeight;
  const frames = Array.isArray(frame.json_layout.frames)
    ? frame.json_layout.frames
    : [];
  const slots = frames.flatMap((item, index): ReadonlyArray<PhotoSlot> => {
    if (!isRecord(item)) return [];
    const rawX = finiteNumber(item.x);
    const rawY = finiteNumber(item.y);
    const rawWidth = positiveNumber(item.width);
    const rawHeight = positiveNumber(item.height);
    if (
      rawX === null ||
      rawY === null ||
      rawWidth === null ||
      rawHeight === null
    )
      return [];

    const scaledWidth = clamp(rawWidth * scaleX, 10, target.width);
    const scaledHeight = clamp(rawHeight * scaleY, 10, target.height);
    const x = clamp(rawX * scaleX, 0, target.width - scaledWidth);
    const y = clamp(rawY * scaleY, 0, target.height - scaledHeight);
    return [
      {
        id: index + 1,
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
        shot: positiveInteger(item.shot) ?? index + 1,
      },
    ];
  });
  return { size, orientation, slots, slotsInFront };
}

export function determineLayout(
  slots: ReadonlyArray<PhotoSlot>,
): "grid" | "strip" {
  if (slots.length < 2) return "grid";
  const centersX = slots.map((slot) => slot.x + slot.width / 2);
  const centersY = slots.map((slot) => slot.y + slot.height / 2);
  return Math.max(...centersY) - Math.min(...centersY) >
    Math.max(...centersX) - Math.min(...centersX)
    ? "strip"
    : "grid";
}


export function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function isStatus(value: string | null): value is TemplateStatus {
  return TEMPLATE_STATUSES.some((status) => status === value);
}

/**
 * Slot dibaca apa adanya dalam koordinat kanvas tersimpan — kartu menampilkannya
 * sebagai persen, jadi tidak perlu dikonversi ke ukuran kertas mana pun.
 */
export function readLayout(frame: TemplateRecord): FrameLayoutInfo {
  const layout = isRecord(frame.json_layout) ? frame.json_layout : null;
  const canvas = layout && isRecord(layout.canvas) ? layout.canvas : null;
  const width = Number(canvas?.width) > 0 ? Number(canvas?.width) : 1200;
  const height = Number(canvas?.height) > 0 ? Number(canvas?.height) : 1800;
  // TemplateResource tidak selalu mengirim paper_size; penandanya ikut tersimpan di layout.
  const storedPaperSize = layout?.paper_size;
  const paperSize: TemplatePaperSize =
    frame.paper_size ??
    (storedPaperSize === "2r" || storedPaperSize === "4r"
      ? storedPaperSize
      : "4r");
  const frames = layout && Array.isArray(layout.frames) ? layout.frames : [];
  const slots = frames.flatMap((item, index): ReadonlyArray<LayoutSlot> => {
    if (!isRecord(item)) return [];
    const x = Number(item.x);
    const y = Number(item.y);
    const slotWidth = Number(item.width);
    const slotHeight = Number(item.height);
    if (!Number.isFinite(x + y + slotWidth + slotHeight)) return [];
    if (slotWidth <= 0 || slotHeight <= 0) return [];
    const shot = Number(item.shot);
    return [
      {
        x,
        y,
        width: slotWidth,
        height: slotHeight,
        shot: Number.isFinite(shot) && shot >= 1 ? Math.round(shot) : index + 1,
      },
    ];
  });
  return {
    width,
    height,
    paperSize,
    slotsInFront: layout?.slots_on_top === true,
    slots,
  };
}


