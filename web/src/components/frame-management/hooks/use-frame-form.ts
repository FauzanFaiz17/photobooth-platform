import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { isSuperAdmin } from "@/features/auth/auth-access";
import { useAuth } from "@/features/auth/auth-context";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import {
  detectSlotsInImage,
  type DetectedSlot,
} from "@/features/templates/slot-detection";
import {
  createTemplate,
  getTemplate,
  updateTemplate,
  uploadTemplateAsset,
} from "@/features/templates/template-service";
import {
  QR_SLOT_ID,
  SLOT_RATIOS,
  type FormErrors,
  type FrameOrientation,
  type FrameSize,
  type PhotoSlot,
  type QrRect,
  type SlotRatio,
  type TemplateRecord,
  type TemplateStatus,
  type TemplateType,
} from "@/features/templates/template.types";
import { ApiError, resolveStorageUrl } from "@/lib/api-client";
import {
  clamp,
  determineLayout,
  frameDimensions,
  paperSizeForFrame,
  readFrameLayout,
  slotRatioOf,
} from "../utils";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";


export function useFrameForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { frameId: frameIdParam } = useParams<{ frameId: string }>();
  const { token, user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const { handleApiError } = useApiErrorHandler();
  const frameId = Number(frameIdParam);
  const editing = Number.isInteger(frameId) && frameId > 0;

  const nextSlotId = useRef(1);
  const copiedSlotRef = useRef<PhotoSlot | null>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const overlayUrlRef = useRef<string | null>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [overlayBroken, setOverlayBroken] = useState(false);
  const [slotsInFront, setSlotsInFront] = useState(false);
  const [canvasDark, setCanvasDark] = useState(false);
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]);
  const [partnerId, setPartnerId] = useState(String(user?.partner?.id ?? ""));
  const [name, setName] = useState("");
  const [type, setType] = useState<TemplateType>("photo");
  const [status, setStatus] = useState<TemplateStatus>("draft");
  const [size, setSize] = useState<FrameSize>("4R");
  const [orientation, setOrientation] = useState<FrameOrientation>("portrait");
  const [slots, setSlots] = useState<ReadonlyArray<PhotoSlot>>([]);
  const [qr, setQr] = useState<QrRect | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [frame, setFrame] = useState<TemplateRecord | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    editing ? "loading" : "ready",
  );
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
      ? getPartners(token, { status: "active", per_page: 100 }, controller.signal)
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
          setType(loadedFrame.type ?? "photo");
          setStatus(loadedFrame.status);
          setSize(layout.size);
          setOrientation(layout.orientation);
          setSlots(layout.slots);
          setSlotsInFront(layout.slotsInFront);
          setQr(layout.qr);
          setOverlayUrl(loadedFrame.png_url ?? resolveStorageUrl(loadedFrame.png_path));
          nextSlotId.current = Math.max(0, ...layout.slots.map((slot) => slot.id)) + 1;
        }
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (handleApiError(error)) return;
        setFormError(error instanceof ApiError ? error.message : "Data Frame tidak dapat dimuat.");
        setLoadState("error");
      });

    return () => controller.abort();
  }, [editing, frameId, handleApiError, superAdmin, token]);

  useEffect(
    () => () => {
      if (overlayUrlRef.current) URL.revokeObjectURL(overlayUrlRef.current);
    },
    [],
  );

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

  function pickOverlay(file: File) {
    if (overlayUrlRef.current) URL.revokeObjectURL(overlayUrlRef.current);
    overlayUrlRef.current = URL.createObjectURL(file);
    setOverlayUrl(overlayUrlRef.current);
    setOverlayFile(file);
    setOverlayBroken(false);
    setErrors((current) => ({ ...current, png: undefined }));
    void runDetection(file, overlayUrlRef.current);
  }

  async function runDetection(source: Blob, imageUrl: string): Promise<void> {
    setDetecting(true);
    try {
      const detected = await detectSlotsInImage(source, frameDimensions(size, orientation));
      if (detected.length === 0) {
        toast.info("Tidak ada kotak transparan pada PNG ini. Tambahkan slot manual.");
        return;
      }
      setDetection({ slots: detected, imageUrl });
    } catch {
      toast.error("PNG tidak dapat dibaca untuk deteksi otomatis.");
    } finally {
      setDetecting(false);
    }
  }

  async function detectFromCurrent(): Promise<void> {
    if (!overlayUrl) return;
    try {
      const source = overlayFile ?? (await (await fetch(overlayUrl)).blob());
      await runDetection(source, overlayUrl);
    } catch {
      toast.error("PNG tidak dapat diambil untuk deteksi otomatis.");
    }
  }

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

  const selectedSlot =
    selectedSlotId === QR_SLOT_ID
      ? null
      : (slots.find((slot) => slot.id === selectedSlotId) ?? null);
  const canvasSize = frameDimensions(size, orientation);
  const canvasWidth = canvasSize.width;
  const canvasHeight = canvasSize.height;
  const canvasAspect = canvasWidth / canvasHeight;
  const maxDisplayWidth = availableWidth ? Math.max(160, Math.floor(availableWidth) - 24) : 620;
  const displayWidth = Math.round(Math.min(maxDisplayWidth, 560 * canvasAspect));
  const displayHeight = Math.round(displayWidth / canvasAspect);
  const selectedRatio = selectedSlot ? slotRatioOf(selectedSlot) : null;

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
    const offset = (slots.length % 4) * Math.round(Math.min(canvasSize.width, canvasSize.height) * 0.025);
    const slot: PhotoSlot = {
      id: nextSlotId.current++,
      x: clamp(Math.round(canvasSize.width * 0.1) + offset, 0, canvasSize.width - slotWidth),
      y: clamp(Math.round(canvasSize.height * 0.1) + offset, 0, canvasSize.height - slotHeight),
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

  const duplicateSlot = useCallback(
    (source: PhotoSlot): void => {
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
    },
    [canvasHeight, canvasWidth],
  );

  function removeSlot(slotId: number) {
    setSlots((current) => current.filter((slot) => slot.id !== slotId));
    setSelectedSlotId((current) => (current === slotId ? null : current));
  }

  function addQr() {
    const size = Math.round(Math.min(canvasSize.width, canvasSize.height) * 0.16);
    setQr({
      x: clamp(canvasSize.width - size - Math.round(canvasSize.width * 0.04), 0, canvasSize.width - size),
      y: clamp(canvasSize.height - size - Math.round(canvasSize.height * 0.04), 0, canvasSize.height - size),
      width: size,
      height: size,
    });
    setSelectedSlotId(QR_SLOT_ID);
    setErrors((current) => ({ ...current, qr: undefined }));
  }

  function removeQr() {
    setQr(null);
    setSelectedSlotId((current) => (current === QR_SLOT_ID ? null : current));
  }

  const updateQr = useCallback(
    (updates: Partial<QrRect>) => {
      setQr((current) => {
        if (!current) return current;
        const next = { ...current, ...updates };
        const width = clamp(next.width, 24, canvasSize.width);
        const height = clamp(next.height, 24, canvasSize.height);
        return {
          ...next,
          width,
          height,
          x: clamp(next.x, 0, canvasSize.width - width),
          y: clamp(next.y, 0, canvasSize.height - height),
        };
      });
    },
    [canvasSize.height, canvasSize.width],
  );

  function changeQrNumber(field: keyof QrRect, value: string) {
    if (!qr) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const maximum =
      field === "x" ? canvasSize.width - qr.width
        : field === "y" ? canvasSize.height - qr.height
          : field === "width" ? canvasSize.width - qr.x
            : canvasSize.height - qr.y;
    updateQr({
      [field]: clamp(parsed, field === "x" || field === "y" ? 0 : 24, maximum),
    });
  }

  function changeSlotNumber(field: "shot" | "x" | "y" | "width" | "height", value: string) {
    if (!selectedSlot) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    if (field === "shot") {
      updateSlot(selectedSlot.id, { shot: Math.max(1, Math.round(parsed)) });
      return;
    }
    const maximum =
      field === "x" ? canvasSize.width - selectedSlot.width
        : field === "y" ? canvasSize.height - selectedSlot.height
          : field === "width" ? canvasSize.width - selectedSlot.x
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
    if (nextOrientation !== orientation) {
      setSlots([]);
      setSelectedSlotId(null);
      setQr(null);
    } else {
      setSlots((current) =>
        current.map((slot) => {
          const width = clamp(Math.round((slot.width * next.width) / previous.width), 10, next.width);
          const height = clamp(Math.round((slot.height * next.height) / previous.height), 10, next.height);
          return {
            ...slot,
            x: clamp(Math.round((slot.x * next.width) / previous.width), 0, next.width - width),
            y: clamp(Math.round((slot.y * next.height) / previous.height), 0, next.height - height),
            width,
            height,
          };
        }),
      );
      setQr((current) => {
        if (!current) return current;
        const width = clamp(Math.round((current.width * next.width) / previous.width), 24, next.width);
        const height = clamp(Math.round((current.height * next.height) / previous.height), 24, next.height);
        return {
          x: clamp(Math.round((current.x * next.width) / previous.width), 0, next.width - width),
          y: clamp(Math.round((current.y * next.height) / previous.height), 0, next.height - height),
          width,
          height,
        };
      });
    }
    setSize(nextSize);
    setOrientation(nextOrientation);
  }

  function changeOrientation(nextOrientation: FrameOrientation) {
    if (nextOrientation === orientation) return;
    setOrientation(nextOrientation);
    setSlots([]);
    setSelectedSlotId(null);
    setQr(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || pending) return;
    const nextErrors: FormErrors = {};
    if (!Number.isInteger(Number(partnerId)) || Number(partnerId) <= 0) nextErrors.partner_id = "Partner wajib dipilih.";
    if (!name.trim()) nextErrors.name = "Nama Frame wajib diisi.";
    else if (name.trim().length > 150) nextErrors.name = "Maksimal 150 karakter.";
    if (!overlayUrl) nextErrors.png = "Unggah PNG frame terlebih dahulu.";
    if (slots.length === 0) nextErrors.slots = "Tambahkan minimal satu slot foto.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMode("edit");
      return;
    }
    setPending(true);
    setErrors({});
    setFormError("");
    try {
      const currentCanvas = frame && isRecord(frame.json_layout) && isRecord(frame.json_layout.canvas) ? frame.json_layout.canvas : null;
      const payload = {
        partner_id: Number(partnerId),
        name: name.trim(),
        type,
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
            background: typeof currentCanvas?.background === "string" ? currentCanvas.background : "#ffffff",
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
          ...(qr
            ? {
                qr: {
                  x: Math.round(qr.x),
                  y: Math.round(qr.y),
                  width: Math.round(qr.width),
                  height: Math.round(qr.height),
                },
              }
            : {}),
        },
      };
      const saved = editing ? await updateTemplate(token, frameId, payload) : await createTemplate(token, payload);
      if (overlayFile) {
        try {
          await uploadTemplateAsset(token, saved.id, overlayFile, "png");
        } catch {
          setFormError(`Frame ${saved.name} tersimpan, tapi PNG gagal diunggah. Buka lagi Frame ini untuk mengulang unggahan.`);
          return;
        }
      }
      toast.success(`Frame ${saved.name} ${editing ? "diperbarui" : "ditambahkan"}.`);
      navigate("/frame-photo", { replace: true });
    } catch (error: unknown) {
      if (handleApiError(error)) return;
      if (error instanceof ApiError && error.status === 422) {
        setFormError(error.message || "Periksa kembali data Frame.");
        return;
      }
      setFormError(error instanceof ApiError ? error.message : "Tidak dapat terhubung ke server.");
    } finally {
      setPending(false);
    }
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  return {
    editing,
    superAdmin,
    token,
    navigate,
    location,
    nextSlotId,
    copiedSlotRef,
    overlayInputRef,
    canvasAreaRef,
    overlayUrl,
    overlayFile,
    overlayBroken,
    slotsInFront,
    canvasDark,
    partners,
    partnerId,
    name,
    type,
    status,
    size,
    orientation,
    slots,
    qr,
    selectedSlotId,
    errors,
    formError,
    pending,
    mode,
    frame,
    loadState,
    availableWidth,
    detection,
    detecting,
    selectedSlot,
    canvasSize,
    canvasWidth,
    canvasHeight,
    canvasAspect,
    displayWidth,
    displayHeight,
    selectedRatio,
    setOverlayUrl,
    setOverlayBroken,
    setSlotsInFront,
    setCanvasDark,
    setPartnerId,
    setName,
    setType,
    setStatus,
    setSlots,
    setQr,
    setSelectedSlotId,
    setErrors,
    setFormError,
    setPending,
    setMode,
    setLoadState,
    setAvailableWidth,
    setDetection,
    pickOverlay,
    runDetection,
    detectFromCurrent,
    applyDetected,
    applySlotRatio,
    addSlot,
    updateSlot,
    duplicateSlot,
    removeSlot,
    addQr,
    removeQr,
    updateQr,
    changeQrNumber,
    changeSlotNumber,
    changeFrameSize,
    changeOrientation,
    handleSubmit,
  };
}
