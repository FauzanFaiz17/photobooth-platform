import { Canvas, FabricImage, Rect } from "fabric";
import {
  ArrowLeft,
  Copy,
  Eye,
  ImageUp,
  LoaderCircle,
  Pencil,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Save,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import samplePhoto from "@/assets/preview.webp";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { isSuperAdmin } from "@/features/auth/auth-access";
import { useAuth } from "@/features/auth/auth-context";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import {
  detectSlotsInImage,
  type DetectedSlot,
} from "@/features/templates/slot-detection";
import { shotColor } from "@/features/templates/shot-colors";
import {
  createTemplate,
  getTemplate,
  updateTemplate,
  uploadTemplateAsset,
} from "@/features/templates/template-service";
import {
  TEMPLATE_PAPER_SIZES,
  type TemplatePaperSize,
  type TemplateRecord,
  type TemplateStatus,
} from "@/features/templates/template.types";
import { ApiError, resolveStorageUrl } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { FrameSlotDetectDialog } from "./frame-slot-detect-dialog";
import { Switch } from "../ui/switch";

// Template 2R dicetak di lembar 4R berisi dua strip identik, lalu dipotong tengah.
// Jadi kanvasnya sama-sama 1200x1800; yang membedakan hanya susunan slot dan paper_size.
const FRAME_SIZES = {
  "2R": {
    width: 1200,
    height: 1800,
    label: "2R strip (cetak 4R, potong jadi 2)",
  },
  "4R": { width: 1200, height: 1800, label: "4R (10 x 15 cm)" },
} as const;

type FrameSize = keyof typeof FRAME_SIZES;
type FrameOrientation = "portrait" | "landscape";

/** 2R selalu portrait (strip); hanya 4R yang bisa ditukar orientasinya. */
function frameDimensions(
  size: FrameSize,
  orientation: FrameOrientation,
): { width: number; height: number } {
  const base = FRAME_SIZES[size];
  return size === "4R" && orientation === "landscape"
    ? { width: base.height, height: base.width }
    : { width: base.width, height: base.height };
}

/** Rasio awal slot; hanya dipakai saat ukuran diterapkan, resize tetap bebas. */
const SLOT_RATIOS = {
  "3:2": { value: 3 / 2, label: "Persegi panjang 3:2 (mendatar)" },
  "2:3": { value: 2 / 3, label: "Persegi panjang 2:3 (tegak)" },
  "1:1": { value: 1, label: "Persegi 1:1" },
} as const;

type SlotRatio = keyof typeof SLOT_RATIOS;

interface PhotoSlot {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shot: number;
}

interface FormErrors {
  partner_id?: string;
  name?: string;
  png?: string;
  slots?: string;
}

type SlotRect = Rect & { slotId: number };

interface FrameCanvasProps {
  canvasWidth: number;
  canvasHeight: number;
  displayWidth: number;
  displayHeight: number;
  overlayUrl: string | null;
  slotsInFront: boolean;
  slots: ReadonlyArray<PhotoSlot>;
  selectedSlotId: number | null;
  onSelect: (slotId: number | null) => void;
  onChange: (slotId: number, updates: Partial<Omit<PhotoSlot, "id">>) => void;
  onOverlayError: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveInteger(value: unknown): number | null {
  const parsed = finiteNumber(value);
  return parsed !== null && parsed >= 1 ? Math.trunc(parsed) : null;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function isSlotRect(object: object): object is SlotRect {
  return typeof (object as SlotRect).slotId === "number";
}

function slotRatioOf(slot: Pick<PhotoSlot, "width" | "height">): SlotRatio | null {
  if (slot.height <= 0) return null;
  const ratio = slot.width / slot.height;
  const options = Object.keys(SLOT_RATIOS) as SlotRatio[];
  return (
    options.find(
      (key) => Math.abs(ratio - SLOT_RATIOS[key].value) < 0.02,
    ) ?? null
  );
}

function FrameCanvas({
  canvasWidth,
  canvasHeight,
  displayWidth,
  displayHeight,
  overlayUrl,
  slotsInFront,
  slots,
  selectedSlotId,
  onSelect,
  onChange,
  onOverlayError,
}: FrameCanvasProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const overlayRef = useRef<FabricImage | null>(null);
  const callbacksRef = useRef({ onSelect, onChange, onOverlayError });

  /** Slot digambar sebagai object biasa, jadi urutannya relatif terhadap overlay bisa dibalik. */
  function applyOverlayOrder(canvas: Canvas, inFront: boolean) {
    const overlay = overlayRef.current;
    if (!overlay) return;
    if (inFront) canvas.sendObjectToBack(overlay);
    else canvas.bringObjectToFront(overlay);
  }

  useEffect(() => {
    callbacksRef.current = { onSelect, onChange, onOverlayError };
  }, [onChange, onOverlayError, onSelect]);

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
      callbacksRef.current.onChange(object.slotId, {
        x: left,
        y: top,
        width: objectWidth,
        height: objectHeight,
      });
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

    current.forEach((object) => canvas.remove(object));
    applyOverlayOrder(canvas, slotsInFront);
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
    </div>
  );
}

/**
 * paper_size tidak dikembalikan TemplateResource, dan kedua ukuran kini punya kanvas
 * identik — jadi dimensi tidak bisa dipakai membedakan. Penanda disimpan di dalam
 * json_layout, satu-satunya bagian payload yang dijamin round-trip.
 */
function readFrameSize(frame: TemplateRecord): FrameSize | null {
  if (frame.paper_size === "2r") return "2R";
  if (frame.paper_size === "4r") return "4R";
  if (isRecord(frame.json_layout)) {
    const stored = frame.json_layout.paper_size;
    if (stored === "2r") return "2R";
    if (stored === "4r") return "4R";
  }
  return null;
}

function paperSizeForFrame(size: FrameSize): TemplatePaperSize {
  return size === "2R" ? "2r" : "4r";
}

function readFrameLayout(frame: TemplateRecord): {
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
    return [{ id: index + 1, x, y, width: scaledWidth, height: scaledHeight, shot: positiveInteger(item.shot) ?? index + 1 }];
  });
  return { size, orientation, slots, slotsInFront };
}

function determineLayout(slots: ReadonlyArray<PhotoSlot>): "grid" | "strip" {
  if (slots.length < 2) return "grid";
  const centersX = slots.map((slot) => slot.x + slot.width / 2);
  const centersY = slots.map((slot) => slot.y + slot.height / 2);
  return Math.max(...centersY) - Math.min(...centersY) >
    Math.max(...centersX) - Math.min(...centersX)
    ? "strip"
    : "grid";
}





export function FrameCreatePage(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { frameId: frameIdParam } = useParams<{ frameId: string }>();
  const { token, user, logout } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const frameId = Number(frameIdParam);
  const editing = Number.isInteger(frameId) && frameId > 0;
  const nextSlotId = useRef(1);
  const copiedSlotRef = useRef<PhotoSlot | null>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const overlayUrlRef = useRef<string | null>(null);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [overlayBroken, setOverlayBroken] = useState(false);
  const [slotsInFront, setSlotsInFront] = useState(false);
  const [canvasDark, setCanvasDark] = useState(false);
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]);
  const [partnerId, setPartnerId] = useState(String(user?.partner?.id ?? ""));
  const [name, setName] = useState("");
  const [status, setStatus] = useState<TemplateStatus>("draft");
  const [size, setSize] = useState<FrameSize>("4R");
  const [orientation, setOrientation] = useState<FrameOrientation>("portrait");
  const [slots, setSlots] = useState<ReadonlyArray<PhotoSlot>>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [frame, setFrame] = useState<TemplateRecord | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    editing ? "loading" : "ready",
  );
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const [detection, setDetection] = useState<{
    slots: ReadonlyArray<DetectedSlot>;
    imageUrl: string;
  } | null>(null);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    const frameRequest = editing
      ? getTemplate(token, frameId, controller.signal)
      : Promise.resolve(null);
    const partnersRequest = superAdmin
      ? getPartners(
          token,
          { status: "active", per_page: 100 },
          controller.signal,
        )
      : Promise.resolve(null);

    void Promise.all([frameRequest, partnersRequest])
      .then(([loadedFrame, partnersResponse]) => {
        if (controller.signal.aborted) return;
        setPartners(partnersResponse?.data ?? []);
        if (loadedFrame) {
          const layout = readFrameLayout(loadedFrame);
          setFrame(loadedFrame);
          setPartnerId(String(loadedFrame.partner?.id ?? ""));
          setName(loadedFrame.name);
          setStatus(loadedFrame.status);
          setSize(layout.size);
          setOrientation(layout.orientation);
          setSlots(layout.slots);
          setSlotsInFront(layout.slotsInFront);
          setOverlayUrl(loadedFrame.png_url ?? resolveStorageUrl(loadedFrame.png_path));
          nextSlotId.current =
            Math.max(0, ...layout.slots.map((slot) => slot.id)) + 1;
        }
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          void logout().then(() =>
            navigate("/login", { replace: true, state: { from: location } }),
          );
          return;
        }
        if (error instanceof ApiError && error.status === 403) {
          navigate("/admin/forbidden", {
            replace: true,
            state: { from: location.pathname },
          });
          return;
        }
        setFormError(
          error instanceof ApiError
            ? error.message
            : "Data Frame tidak dapat dimuat.",
        );
        setLoadState("error");
      });

    return () => controller.abort();
  }, [editing, frameId, location, logout, navigate, superAdmin, token]);

  useEffect(
    () => () => {
      if (overlayUrlRef.current) URL.revokeObjectURL(overlayUrlRef.current);
    },
    [],
  );

  /** Kanvas diskalakan mengikuti lebar area editor agar landscape tidak terpotong. */
  useEffect(() => {
    const element = canvasAreaRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setAvailableWidth(width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /**
   * PNG ditampilkan dari objectURL lokal, bukan dari png_path hasil unggah — backend
   * belum punya endpoint penyaji asset, jadi URL storage-nya selalu gagal dimuat.
   * Unggahannya sendiri ditunda sampai Frame punya id (setelah simpan).
   */
  function pickOverlay(file: File) {
    if (overlayUrlRef.current) URL.revokeObjectURL(overlayUrlRef.current);
    overlayUrlRef.current = URL.createObjectURL(file);
    setOverlayUrl(overlayUrlRef.current);
    setOverlayFile(file);
    setOverlayBroken(false);
    setErrors((current) => ({ ...current, png: undefined }));
    void runDetection(file, overlayUrlRef.current);
  }

  /** Auto deteksi: baca area transparan PNG lalu tawarkan polanya ke pengguna. */
  async function runDetection(source: Blob, imageUrl: string): Promise<void> {
    setDetecting(true);
    try {
      const detected = await detectSlotsInImage(
        source,
        frameDimensions(size, orientation),
      );
      if (detected.length === 0) {
        toast.info(
          "Tidak ada kotak transparan pada PNG ini. Tambahkan slot manual.",
        );
        return;
      }
      setDetection({ slots: detected, imageUrl });
    } catch {
      toast.error("PNG tidak dapat dibaca untuk deteksi otomatis.");
    } finally {
      setDetecting(false);
    }
  }

  /** Untuk Frame yang sudah tersimpan belum tentu ada berkasnya, jadi PNG diambil ulang. */
  async function detectFromCurrent(): Promise<void> {
    if (!overlayUrl) return;
    try {
      const source = overlayFile ?? (await (await fetch(overlayUrl)).blob());
      await runDetection(source, overlayUrl);
    } catch {
      toast.error("PNG tidak dapat diambil untuk deteksi otomatis.");
    }
  }

  /** Nomor foto diisi bergilang mengikuti urutan kotak hasil deteksi. */
  function applyDetected(shotCount: number): void {
    if (!detection) return;
    const created = detection.slots.map((box, index) => ({
      id: nextSlotId.current++,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      shot: (index % shotCount) + 1,
    }));
    setSlots(created);
    setSelectedSlotId(created[0]?.id ?? null);
    setErrors((current) => ({ ...current, slots: undefined }));
    setDetection(null);
  }

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) ?? null;
  const canvasSize = frameDimensions(size, orientation);
  const canvasWidth = canvasSize.width;
  const canvasHeight = canvasSize.height;
  const canvasAspect = canvasWidth / canvasHeight;
  // Sisakan ruang untuk border-8 + ring pada bingkai kanvas.
  const maxDisplayWidth = availableWidth
    ? Math.max(160, Math.floor(availableWidth) - 24)
    : 620;
  const displayWidth = Math.round(
    Math.min(maxDisplayWidth, 560 * canvasAspect),
  );
  const displayHeight = Math.round(displayWidth / canvasAspect);
  const selectedRatio = selectedSlot ? slotRatioOf(selectedSlot) : null;

  /** Terapkan rasio sebagai ukuran awal; posisi digeser otomatis agar tetap di kanvas. */
  function applySlotRatio(ratio: SlotRatio): void {
    if (!selectedSlot) return;
    let width = selectedSlot.width;
    let height = Math.round(width / SLOT_RATIOS[ratio].value);
    if (height > canvasSize.height) {
      height = canvasSize.height;
      width = Math.round(height * SLOT_RATIOS[ratio].value);
    }
    updateSlot(selectedSlot.id, { width, height });
  }

  function addSlot() {
    const slotWidth = Math.round(canvasSize.width * 0.8);
    const slotHeight = Math.round(slotWidth / SLOT_RATIOS["3:2"].value);
    const offset =
      (slots.length % 4) *
      Math.round(Math.min(canvasSize.width, canvasSize.height) * 0.025);
    const slot: PhotoSlot = {
      id: nextSlotId.current++,
      x: clamp(
        Math.round(canvasSize.width * 0.1) + offset,
        0,
        canvasSize.width - slotWidth,
      ),
      y: clamp(
        Math.round(canvasSize.height * 0.1) + offset,
        0,
        canvasSize.height - slotHeight,
      ),
      width: slotWidth,
      height: slotHeight,
      shot: Math.max(0, ...slots.map((item) => item.shot)) + 1,
    };
    setSlots((current) => [...current, slot]);
    setSelectedSlotId(slot.id);
    setErrors((current) => ({ ...current, slots: undefined }));
  }

  const updateSlot = useCallback(
    (slotId: number, updates: Partial<Omit<PhotoSlot, "id">>) => {
      setSlots((current) =>
        current.map((slot) => {
          if (slot.id !== slotId) return slot;
          const next = { ...slot, ...updates };
          const width = clamp(next.width, 10, canvasSize.width);
          const height = clamp(next.height, 10, canvasSize.height);
          return {
            ...next,
            width,
            height,
            x: clamp(next.x, 0, canvasSize.width - width),
            y: clamp(next.y, 0, canvasSize.height - height),
          };
        }),
      );
    },
    [canvasSize.height, canvasSize.width],
  );

  /** Salinan digeser sedikit supaya slot aslinya masih bisa diklik di canvas. */
  const duplicateSlot = useCallback((source: PhotoSlot): void => {
    const step = Math.round(Math.min(canvasWidth, canvasHeight) * 0.03);
    const slot: PhotoSlot = {
      id: nextSlotId.current++,
      width: source.width,
      height: source.height,
      shot: source.shot,
      x: clamp(source.x + step, 0, canvasWidth - source.width),
      y: clamp(source.y + step, 0, canvasHeight - source.height),
    };
    setSlots((current) => [...current, slot]);
    setSelectedSlotId(slot.id);
  }, [canvasHeight, canvasWidth]);

  useEffect(() => {
    function handleEditorShortcut(event: KeyboardEvent): void {
      if (mode !== "edit") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      )
        return;

      /** Slot terpilih digeser dengan tombol panah; Shift untuk langkah 10 px. */
      const nudge = event.shiftKey ? 10 : 1;
      const delta =
        event.key === "ArrowUp"
          ? { x: 0, y: -nudge }
          : event.key === "ArrowDown"
            ? { x: 0, y: nudge }
            : event.key === "ArrowLeft"
              ? { x: -nudge, y: 0 }
              : event.key === "ArrowRight"
                ? { x: nudge, y: 0 }
                : null;
      if (delta) {
        if (!selectedSlot) return;
        event.preventDefault();
        updateSlot(selectedSlot.id, {
          x: selectedSlot.x + delta.x,
          y: selectedSlot.y + delta.y,
        });
        return;
      }

      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "c" && selectedSlot) {
        event.preventDefault();
        copiedSlotRef.current = { ...selectedSlot };
      } else if (key === "v" && copiedSlotRef.current) {
        event.preventDefault();
        duplicateSlot(copiedSlotRef.current);
      }
    }

    window.addEventListener("keydown", handleEditorShortcut);
    return () => window.removeEventListener("keydown", handleEditorShortcut);
  }, [duplicateSlot, mode, selectedSlot, updateSlot]);

  function removeSlot(slotId: number) {
    setSlots((current) => current.filter((slot) => slot.id !== slotId));
    setSelectedSlotId((current) => (current === slotId ? null : current));
  }

  function changeSlotNumber(
    field: "shot" | "x" | "y" | "width" | "height",
    value: string,
  ) {
    if (!selectedSlot) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    if (field === "shot") {
      updateSlot(selectedSlot.id, { shot: Math.max(1, Math.round(parsed)) });
      return;
    }
    const maximum =
      field === "x"
        ? canvasSize.width - selectedSlot.width
        : field === "y"
          ? canvasSize.height - selectedSlot.height
          : field === "width"
            ? canvasSize.width - selectedSlot.x
            : canvasSize.height - selectedSlot.y;
    updateSlot(selectedSlot.id, {
      [field]: clamp(parsed, field === "x" || field === "y" ? 0 : 10, maximum),
    });
  }

  function changeFrameSize(nextSize: FrameSize) {
    if (nextSize === size) return;
    const nextOrientation = nextSize === "4R" ? orientation : "portrait";
    const previous = frameDimensions(size, orientation);
    const next = frameDimensions(nextSize, nextOrientation);

    // 2R tidak punya orientasi, jadi pindah ke sana otomatis mengosongkan slot.
    if (nextOrientation !== orientation) {
      setSlots([]);
      setSelectedSlotId(null);
    } else {
      setSlots((current) =>
        current.map((slot) => {
          const width = clamp(
            Math.round((slot.width * next.width) / previous.width),
            10,
            next.width,
          );
          const height = clamp(
            Math.round((slot.height * next.height) / previous.height),
            10,
            next.height,
          );
          return {
            ...slot,
            x: clamp(
              Math.round((slot.x * next.width) / previous.width),
              0,
              next.width - width,
            ),
            y: clamp(
              Math.round((slot.y * next.height) / previous.height),
              0,
              next.height - height,
            ),
            width,
            height,
          };
        }),
      );
    }

    setSize(nextSize);
    setOrientation(nextOrientation);
  }

  /** Menukar orientasi mengubah dimensi kanvas, jadi slot dikosongkan. */
  function changeOrientation(nextOrientation: FrameOrientation) {
    if (nextOrientation === orientation) return;
    setOrientation(nextOrientation);
    setSlots([]);
    setSelectedSlotId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || pending) return;

    const nextErrors: FormErrors = {};
    if (!Number.isInteger(Number(partnerId)) || Number(partnerId) <= 0)
      nextErrors.partner_id = "Partner wajib dipilih.";
    if (!name.trim()) nextErrors.name = "Nama Frame wajib diisi.";
    else if (name.trim().length > 150)
      nextErrors.name = "Maksimal 150 karakter.";
    if (!overlayUrl) nextErrors.png = "Unggah PNG frame terlebih dahulu.";
    if (slots.length === 0)
      nextErrors.slots = "Tambahkan minimal satu slot foto.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMode("edit");
      return;
    }

    setPending(true);
    setErrors({});
    setFormError("");

    try {
      const currentCanvas =
        frame &&
        isRecord(frame.json_layout) &&
        isRecord(frame.json_layout.canvas)
          ? frame.json_layout.canvas
          : null;
      const payload = {
        partner_id: Number(partnerId),
        name: name.trim(),
        paper_size: paperSizeForFrame(size),
        status,
        preview_path: frame?.preview_path ?? null,
        thumbnail_path: frame?.thumbnail_path ?? null,
        png_path: frame?.png_path ?? null,
        psd_path: frame?.psd_path ?? null,
        json_layout: {
          canvas: {
            width: canvasSize.width,
            height: canvasSize.height,
            background:
              typeof currentCanvas?.background === "string"
                ? currentCanvas.background
                : "#ffffff",
          },
          paper_size: paperSizeForFrame(size),
          orientation,
          slots_on_top: slotsInFront,
          layout: determineLayout(slots),
          frames: slots.map((slot) => ({
            x: Math.round(slot.x),
            y: Math.round(slot.y),
            width: Math.round(slot.width),
            height: Math.round(slot.height),
            shot: Math.max(1, Math.round(slot.shot)),
          })),
        },
      };
      const saved = editing
        ? await updateTemplate(token, frameId, payload)
        : await createTemplate(token, payload);
      if (overlayFile) {
        try {
          await uploadTemplateAsset(token, saved.id, overlayFile, "png");
        } catch {
          setFormError(
            `Frame ${saved.name} tersimpan, tapi PNG gagal diunggah. Buka lagi Frame ini untuk mengulang unggahan.`,
          );
          return;
        }
      }
      toast.success(
        `Frame ${saved.name} ${editing ? "diperbarui" : "ditambahkan"}.`,
      );
      navigate("/frame-photo", { replace: true });
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        await logout();
        navigate("/login", { replace: true, state: { from: location } });
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        navigate("/admin/forbidden", {
          replace: true,
          state: { from: location.pathname },
        });
        return;
      }
      if (error instanceof ApiError && error.status === 422) {
        setFormError(error.message || "Periksa kembali data Frame.");
        return;
      }
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setPending(false);
    }
  }

  if (loadState === "loading") {
    return (
      <div className="grid h-screen place-items-center">
        <LoaderCircle
          className="size-8 animate-spin text-muted-foreground"
          aria-label="Memuat Frame"
        />
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="grid h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-medium">Frame tidak dapat dimuat</p>
          <p className="mt-1 text-sm text-muted-foreground">{formError}</p>
          <Button
            className="mt-4"
            type="button"
            variant="outline"
            onClick={() => navigate("/frame-photo")}
          >
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex h-screen min-w-0 flex-col overflow-hidden bg-muted/40"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Kembali ke daftar Frame"
            title="Kembali ke daftar Frame"
            onClick={() => navigate("/frame-photo")}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {name.trim() || (editing ? "Edit Frame" : "Frame Baru")}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {FRAME_SIZES[size].label} · {canvasSize.width} x{" "}
              {canvasSize.height} px
            </p>
          </div>
          <Badge variant="outline">{status}</Badge>
          {selectedSlot && mode === "edit" && (
            <Badge variant="secondary">
              Slot {slots.findIndex((slot) => slot.id === selectedSlot.id) + 1}
            </Badge>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <label className="hidden items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium sm:flex">
            <span>{canvasDark ? "Background hitam" : "Background putih"}</span>
            <Switch
              checked={canvasDark}
              onCheckedChange={setCanvasDark}
              aria-label="Ganti background canvas"
            />
          </label>
          <div className="flex rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={mode === "edit" ? "secondary" : "ghost"}
              onClick={() => setMode("edit")}
            >
              <Pencil aria-hidden="true" /> Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "preview" ? "secondary" : "ghost"}
              onClick={() => setMode("preview")}
            >
              <Eye aria-hidden="true" /> Preview
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => navigate("/frame-photo")}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={pending || (superAdmin && partners.length === 0)}
          >
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}{" "}
            Simpan Frame
          </Button>
        </div>
      </header>

      <div
        className={cn(
          "grid min-h-0 flex-1 overflow-hidden max-lg:block max-lg:overflow-y-auto",
          mode === "edit" && "lg:grid-cols-[minmax(0,1fr)_20rem]",
        )}
      >
        <section className="flex min-h-0 flex-col overflow-hidden max-lg:h-[70vh]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{size}</Badge>
              <span className="text-xs text-muted-foreground">
                {canvasSize.width} x {canvasSize.height} px · {slots.length} slot
                foto
                {selectedSlot && mode === "edit"
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
                    canvasDark ? "bg-black border-black" : "bg-white border-white",
                  )}
                >
                  <FrameCanvas
                    canvasWidth={canvasSize.width}
                    canvasHeight={canvasSize.height}
                    displayWidth={displayWidth}
                    displayHeight={displayHeight}
                    overlayUrl={overlayUrl}
                    slotsInFront={slotsInFront}
                    slots={slots}
                    selectedSlotId={selectedSlotId}
                    onSelect={setSelectedSlotId}
                    onChange={updateSlot}
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
                          left: `${(slot.x / canvasSize.width) * 100}%`,
                          top: `${(slot.y / canvasSize.height) * 100}%`,
                          width: `${(slot.width / canvasSize.width) * 100}%`,
                          height: `${(slot.height / canvasSize.height) * 100}%`,
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
                    {slots.length === 0 && (
                      <div className="absolute inset-0 grid place-items-center p-6 text-center">
                        <div>
                          <p className="font-medium text-muted-foreground">
                            Canvas {size}
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

        {mode === "edit" && (
          <div className="min-h-0 space-y-4 overflow-y-auto bg-background p-4 max-lg:border-t lg:border-l">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Frame</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {superAdmin && (
                  <div className="grid gap-2">
                    <Label htmlFor="create-frame-partner">Partner/Kiosk</Label>
                    <Select<string>
                      value={partnerId || null}
                      onValueChange={(value) => {
                        if (value !== null) {
                          setPartnerId(value);
                          setErrors((current) => ({
                            ...current,
                            partner_id: undefined,
                          }));
                        }
                      }}
                    >
                      <SelectTrigger
                        id="create-frame-partner"
                        className="w-full"
                        aria-invalid={Boolean(errors.partner_id)}
                      >
                        <SelectValue placeholder="Pilih Partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem
                            key={partner.id}
                            value={String(partner.id)}
                          >
                            {partner.brand_name || partner.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.partner_id && (
                      <p className="text-xs text-destructive">
                        {errors.partner_id}
                      </p>
                    )}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="create-frame-name">Nama</Label>
                  <Input
                    id="create-frame-name"
                    value={name}
                    maxLength={150}
                    placeholder="Contoh: Frame Wedding"
                    aria-invalid={Boolean(errors.name)}
                    onChange={(event) => {
                      setName(event.target.value);
                      setErrors((current) => ({ ...current, name: undefined }));
                    }}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-frame-size">Ukuran</Label>
                  <Select<FrameSize>
                    value={size}
                    onValueChange={(value) =>
                      value !== null && changeFrameSize(value)
                    }
                  >
                    <SelectTrigger id="create-frame-size" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_PAPER_SIZES.map((paperSize) => {
                        const frameSize = paperSize === "2r" ? "2R" : "4R";
                        return (
                          <SelectItem key={paperSize} value={frameSize}>
                            {FRAME_SIZES[frameSize].label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Hasil final {canvasSize.width} x {canvasSize.height} px,
                    tampilan editor diperkecil otomatis.
                  </p>
                </div>
                {size === "4R" && (
                  <div className="grid gap-2">
                    <Label>Orientasi</Label>
                    <div className="flex rounded-md border p-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          orientation === "portrait" ? "secondary" : "ghost"
                        }
                        className="flex-1"
                        onClick={() => changeOrientation("portrait")}
                      >
                        <RectangleVertical aria-hidden="true" /> Portrait
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          orientation === "landscape" ? "secondary" : "ghost"
                        }
                        className="flex-1"
                        onClick={() => changeOrientation("landscape")}
                      >
                        <RectangleHorizontal aria-hidden="true" /> Landscape
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Menukar orientasi mengosongkan slot yang sudah dibuat.
                    </p>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="create-frame-status">Status</Label>
                  <Select<TemplateStatus>
                    value={status}
                    onValueChange={(value) =>
                      value !== null && setStatus(value)
                    }
                  >
                    <SelectTrigger id="create-frame-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

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

            <Card>
              <CardHeader>
                <CardTitle>Gambar Frame</CardTitle>
                <CardDescription>
                  PNG maksimal 10 MB, digambar sesuai canvas {canvasSize.width}{" "}
                  x {canvasSize.height} px.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-3">
                  <input
                    ref={overlayInputRef}
                    type="file"
                    accept="image/png"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) pickOverlay(file);
                      event.target.value = "";
                    }}
                  />
                  <div className="flex items-center gap-3">
                    <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted/40">
                      {overlayUrl && !overlayBroken ? (
                        <img
                          src={overlayUrl}
                          alt="PNG frame saat ini"
                          className="size-full object-contain"
                          onError={() => setOverlayBroken(true)}
                        />
                      ) : (
                        <ImageUp
                          className="size-5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">PNG Frame</p>
                      {overlayBroken && (
                        <p className="mt-0.5 text-xs text-amber-600">
                          Tersimpan, tapi backend belum menyajikannya kembali.
                          Unggah ulang bila ingin melihatnya di editor.
                        </p>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => overlayInputRef.current?.click()}
                      >
                        <ImageUp aria-hidden="true" />{" "}
                        {overlayUrl ? "Ganti" : "Unggah"} PNG
                      </Button>
                    </div>
                  </div>
                  {errors.png && (
                    <p className="text-xs text-destructive">{errors.png}</p>
                  )}
                </div>

                <fieldset className="grid gap-2" disabled={!overlayUrl}>
                  <legend className="text-sm font-medium">
                    Urutan Slot Foto
                  </legend>
                  <p className="text-xs text-muted-foreground">
                    Posisi slot foto terhadap PNG saat dicetak.
                  </p>
                  {(
                    [
                      {
                        value: false,
                        label: "Slot di belakang PNG",
                        hint: "PNG menutupi foto — untuk frame berbingkai.",
                      },
                      {
                        value: true,
                        label: "Slot di depan PNG",
                        hint: "Foto menutupi PNG — untuk background polos.",
                      },
                    ] as const
                  ).map((option) => (
                    <label
                      key={String(option.value)}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-sm",
                        slotsInFront === option.value &&
                          "border-primary bg-primary/5",
                      )}
                    >
                      <input
                        type="radio"
                        name="slot-z-index"
                        className="mt-0.5"
                        checked={slotsInFront === option.value}
                        onChange={() => setSlotsInFront(option.value)}
                      />
                      <span className="min-w-0">
                        <span className="font-medium">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {option.hint}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                
              </CardContent>
            </Card>

            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {formError}
              </p>
            )}
          </div>
        )}
      </div>
      {detection && (
        <FrameSlotDetectDialog
          imageUrl={detection.imageUrl}
          canvas={canvasSize}
          slots={detection.slots}
          replacedCount={slots.length}
          onCancel={() => setDetection(null)}
          onApply={applyDetected}
        />
      )}
      <Toaster position="top-right" />
    </form>
  );
}
