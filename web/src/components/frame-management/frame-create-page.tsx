import { Canvas, FabricImage, Rect } from "fabric"
import { ArrowLeft, Copy, Eye, ImageUp, LoaderCircle, Pencil, Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent, type ReactElement } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import samplePhoto from "@/assets/login-photobooth.webp"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/sonner"
import { isSuperAdmin } from "@/features/auth/auth-access"
import { useAuth } from "@/features/auth/auth-context"
import { getPartners } from "@/features/partners/partner-service"
import type { PartnerRecord } from "@/features/partners/partner.types"
import { createTemplate, getTemplate, updateTemplate, uploadTemplateAsset, type TemplateAssetType } from "@/features/templates/template-service"
import { TEMPLATE_PAPER_SIZES, type TemplatePaperSize, type TemplateRecord, type TemplateStatus } from "@/features/templates/template.types"
import { ApiError, resolveStorageUrl } from "@/lib/api-client"
import { cn } from "@/lib/utils"

// Template 2R dicetak di lembar 4R berisi dua strip identik, lalu dipotong tengah.
// Jadi kanvasnya sama-sama 1200x1800; yang membedakan hanya susunan slot dan paper_size.
const FRAME_SIZES = {
  "2R": { width: 1200, height: 1800, label: "2R strip (cetak 4R, potong jadi 2)" },
  "4R": { width: 1200, height: 1800, label: "4R (1200 x 1800 px)" },
} as const

type FrameSize = keyof typeof FRAME_SIZES

interface PhotoSlot {
  id: number
  x: number
  y: number
  width: number
  height: number
}

interface FormErrors {
  partner_id?: string
  name?: string
  png?: string
  slots?: string
}

type SlotRect = Rect & { slotId: number }

interface FrameCanvasProps {
  canvasWidth: number
  canvasHeight: number
  displayWidth: number
  displayHeight: number
  overlayUrl: string | null
  slotsInFront: boolean
  slots: ReadonlyArray<PhotoSlot>
  selectedSlotId: number | null
  onSelect: (slotId: number | null) => void
  onChange: (slotId: number, updates: Partial<Omit<PhotoSlot, "id">>) => void
  onOverlayError: () => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

function isSlotRect(object: object): object is SlotRect {
  return typeof (object as SlotRect).slotId === "number"
}

function FrameCanvas({ canvasWidth, canvasHeight, displayWidth, displayHeight, overlayUrl, slotsInFront, slots, selectedSlotId, onSelect, onChange, onOverlayError }: FrameCanvasProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const overlayRef = useRef<FabricImage | null>(null)
  const callbacksRef = useRef({ onSelect, onChange, onOverlayError })

  /** Slot digambar sebagai object biasa, jadi urutannya relatif terhadap overlay bisa dibalik. */
  function applyOverlayOrder(canvas: Canvas, inFront: boolean) {
    const overlay = overlayRef.current
    if (!overlay) return
    if (inFront) canvas.sendObjectToBack(overlay)
    else canvas.bringObjectToFront(overlay)
  }

  useEffect(() => {
    callbacksRef.current = { onSelect, onChange, onOverlayError }
  }, [onChange, onOverlayError, onSelect])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const element = document.createElement("canvas")
    container.replaceChildren(element)
    const canvas = new Canvas(element, { width: canvasWidth, height: canvasHeight, selection: false })
    canvas.setDimensions(
      { width: `${displayWidth}px`, height: `${displayHeight}px` },
      { cssOnly: true },
    )
    fabricRef.current = canvas

    canvas.on("selection:created", ({ selected }) => callbacksRef.current.onSelect((selected?.[0] as SlotRect | undefined)?.slotId ?? null))
    canvas.on("selection:updated", ({ selected }) => callbacksRef.current.onSelect((selected?.[0] as SlotRect | undefined)?.slotId ?? null))
    canvas.on("selection:cleared", () => callbacksRef.current.onSelect(null))
    canvas.on("object:moving", ({ target }) => {
      const object = target as SlotRect
      const objectWidth = object.width * object.scaleX
      const objectHeight = object.height * object.scaleY
      object.set({
        left: clamp(object.left ?? 0, 0, Math.max(0, canvasWidth - objectWidth)),
        top: clamp(object.top ?? 0, 0, Math.max(0, canvasHeight - objectHeight)),
      })
    })
    canvas.on("object:modified", ({ target }) => {
      const object = target as SlotRect
      const left = clamp(object.left ?? 0, 0, Math.max(0, canvasWidth - 10))
      const top = clamp(object.top ?? 0, 0, Math.max(0, canvasHeight - 10))
      const objectWidth = clamp(object.width * object.scaleX, 10, canvasWidth - left)
      const objectHeight = clamp(object.height * object.scaleY, 10, canvasHeight - top)
      object.set({ left, top, width: objectWidth, height: objectHeight, scaleX: 1, scaleY: 1 })
      object.setCoords()
      callbacksRef.current.onChange(object.slotId, {
        x: left,
        y: top,
        width: objectWidth,
        height: objectHeight,
      })
    })

    return () => {
      fabricRef.current = null
      overlayRef.current = null
      void canvas.dispose().catch(() => undefined)
      element.remove()
    }
  }, [canvasHeight, canvasWidth, displayHeight, displayWidth])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    let cancelled = false
    const previous = overlayRef.current
    if (previous) {
      canvas.remove(previous)
      overlayRef.current = null
    }
    if (!overlayUrl) {
      canvas.requestRenderAll()
      return
    }

    void FabricImage.fromURL(overlayUrl, { crossOrigin: "anonymous" })
      .then((image) => {
        if (cancelled || fabricRef.current !== canvas) return
        image.set({
          left: 0,
          top: 0,
          originX: "left",
          originY: "top",
          selectable: false,
          evented: false,
          scaleX: canvasWidth / (image.width || canvasWidth),
          scaleY: canvasHeight / (image.height || canvasHeight),
        })
        overlayRef.current = image
        canvas.add(image)
        applyOverlayOrder(canvas, slotsInFront)
        canvas.requestRenderAll()
      })
      .catch(() => {
        if (!cancelled) callbacksRef.current.onOverlayError()
      })

    return () => {
      cancelled = true
    }
    // slotsInFront sengaja tidak jadi dependency: perubahannya ditangani efek urutan di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasHeight, canvasWidth, overlayUrl])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    applyOverlayOrder(canvas, slotsInFront)
    canvas.requestRenderAll()
  }, [overlayUrl, slotsInFront])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const visualScale = canvasWidth / displayWidth
    const current = new Map(canvas.getObjects().filter(isSlotRect).map((object) => [object.slotId, object]))

    slots.forEach((slot) => {
      const values = {
        left: slot.x,
        top: slot.y,
        width: slot.width,
        height: slot.height,
      }
      const existing = current.get(slot.id)
      if (existing) {
        existing.set({ ...values, originX: "left", originY: "top", scaleX: 1, scaleY: 1 })
        existing.setCoords()
        current.delete(slot.id)
      } else {
        const object = new Rect({
          ...values,
          originX: "left",
          originY: "top",
          fill: "rgba(37, 99, 235, 0.10)",
          stroke: "#2563eb",
          strokeDashArray: [8 * visualScale, 6 * visualScale],
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
        }) as SlotRect
        object.slotId = slot.id
        object.setControlsVisibility({ mtr: false })
        canvas.add(object)
      }
    })

    current.forEach((object) => canvas.remove(object))
    applyOverlayOrder(canvas, slotsInFront)
    const selected = canvas.getObjects().filter(isSlotRect).find((object) => object.slotId === selectedSlotId)
    if (selected && canvas.getActiveObject() !== selected) canvas.setActiveObject(selected)
    if (!selected && canvas.getActiveObject()) canvas.discardActiveObject()
    canvas.requestRenderAll()
  }, [canvasHeight, canvasWidth, displayWidth, selectedSlotId, slots, slotsInFront])

  return <div ref={containerRef} role="application" aria-label="Editor slot foto" className="overflow-hidden bg-white [&_.canvas-container]:shadow-2xl" style={{ width: displayWidth, height: displayHeight }} />
}

/**
 * paper_size tidak dikembalikan TemplateResource, dan kedua ukuran kini punya kanvas
 * identik — jadi dimensi tidak bisa dipakai membedakan. Penanda disimpan di dalam
 * json_layout, satu-satunya bagian payload yang dijamin round-trip.
 */
function readFrameSize(frame: TemplateRecord): FrameSize | null {
  if (frame.paper_size === "2r") return "2R"
  if (frame.paper_size === "4r") return "4R"
  if (isRecord(frame.json_layout)) {
    const stored = frame.json_layout.paper_size
    if (stored === "2r") return "2R"
    if (stored === "4r") return "4R"
  }
  return null
}

function paperSizeForFrame(size: FrameSize): TemplatePaperSize {
  return size === "2R" ? "2r" : "4r"
}

function readFrameLayout(frame: TemplateRecord): { size: FrameSize; slots: ReadonlyArray<PhotoSlot>; slotsInFront: boolean } {
  const preferredSize = readFrameSize(frame)
  if (!isRecord(frame.json_layout)) return { size: preferredSize ?? "4R", slots: [], slotsInFront: false }
  const slotsInFront = frame.json_layout.slots_on_top === true

  const canvas = isRecord(frame.json_layout.canvas) ? frame.json_layout.canvas : null
  const sourceWidth = positiveNumber(canvas?.width) ?? FRAME_SIZES[preferredSize ?? "4R"].width
  const sourceHeight = positiveNumber(canvas?.height) ?? FRAME_SIZES[preferredSize ?? "4R"].height
  const size = preferredSize ?? "4R"
  const target = FRAME_SIZES[size]
  const scaleX = target.width / sourceWidth
  const scaleY = target.height / sourceHeight
  const frames = Array.isArray(frame.json_layout.frames) ? frame.json_layout.frames : []
  const slots = frames.flatMap((item, index): ReadonlyArray<PhotoSlot> => {
    if (!isRecord(item)) return []
    const rawX = finiteNumber(item.x)
    const rawY = finiteNumber(item.y)
    const rawWidth = positiveNumber(item.width)
    const rawHeight = positiveNumber(item.height)
    if (rawX === null || rawY === null || rawWidth === null || rawHeight === null) return []

    const scaledWidth = clamp(rawWidth * scaleX, 10, target.width)
    const scaledHeight = clamp(rawHeight * scaleY, 10, target.height)
    const x = clamp(rawX * scaleX, 0, target.width - scaledWidth)
    const y = clamp(rawY * scaleY, 0, target.height - scaledHeight)
    return [{ id: index + 1, x, y, width: scaledWidth, height: scaledHeight }]
  })
  return { size, slots, slotsInFront }
}

function determineLayout(slots: ReadonlyArray<PhotoSlot>): "grid" | "strip" {
  if (slots.length < 2) return "grid"
  const centersX = slots.map((slot) => slot.x + slot.width / 2)
  const centersY = slots.map((slot) => slot.y + slot.height / 2)
  return Math.max(...centersY) - Math.min(...centersY) > Math.max(...centersX) - Math.min(...centersX) ? "strip" : "grid"
}


const ASSET_FIELDS: ReadonlyArray<{ type: TemplateAssetType; label: string; hint: string }> = [
  { type: "preview", label: "Preview", hint: "Tampil di kiosk saat pelanggan memilih frame." },
  { type: "thumbnail", label: "Thumbnail", hint: "Cadangan preview pada daftar Frame." },
]

function AssetUpload({ templateId, type, label, hint, currentPath, onUploaded, onFailed }: {
  readonly templateId: number
  readonly type: TemplateAssetType
  readonly label: string
  readonly hint: string
  readonly currentPath: string | null
  readonly onUploaded: (saved: TemplateRecord) => void
  readonly onFailed: (message: string) => void
}): ReactElement {
  const { token } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const previewUrl = resolveStorageUrl(currentPath)

  async function upload(file: File): Promise<void> {
    if (!token || busy) return
    setBusy(true)
    try {
      onUploaded(await uploadTemplateAsset(token, templateId, file, type))
      toast.success(`${label} berhasil diunggah.`)
    } catch (caught: unknown) {
      onFailed(caught instanceof ApiError ? Object.values(caught.validationErrors).flat()[0] ?? caught.message : "Tidak dapat terhubung ke server.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted/40">
        {previewUrl
          ? <img src={previewUrl} alt={`${label} saat ini`} className="size-full object-contain" />
          : <ImageUp className="size-5 text-muted-foreground" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        <input
          ref={inputRef}
          id={`asset-${type}`}
          type="file"
          accept="image/png"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <Button type="button" size="sm" variant="outline" className="mt-2" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ImageUp aria-hidden="true" />}
          {currentPath ? "Ganti" : "Unggah"} PNG
        </Button>
      </div>
    </div>
  )
}

export function FrameCreatePage(): ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const { frameId: frameIdParam } = useParams<{ frameId: string }>()
  const { token, user, logout } = useAuth()
  const superAdmin = isSuperAdmin(user)
  const frameId = Number(frameIdParam)
  const editing = Number.isInteger(frameId) && frameId > 0
  const nextSlotId = useRef(1)
  const overlayInputRef = useRef<HTMLInputElement>(null)
  const overlayUrlRef = useRef<string | null>(null)
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null)
  const [overlayFile, setOverlayFile] = useState<File | null>(null)
  const [overlayBroken, setOverlayBroken] = useState(false)
  const [slotsInFront, setSlotsInFront] = useState(false)
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([])
  const [partnerId, setPartnerId] = useState(String(user?.partner?.id ?? ""))
  const [name, setName] = useState("")
  const [status, setStatus] = useState<TemplateStatus>("draft")
  const [size, setSize] = useState<FrameSize>("4R")
  const [slots, setSlots] = useState<ReadonlyArray<PhotoSlot>>([])
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [frame, setFrame] = useState<TemplateRecord | null>(null)
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(editing ? "loading" : "ready")

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()

    const frameRequest = editing ? getTemplate(token, frameId, controller.signal) : Promise.resolve(null)
    const partnersRequest = superAdmin ? getPartners(token, { status: "active", per_page: 100 }, controller.signal) : Promise.resolve(null)

    void Promise.all([frameRequest, partnersRequest])
      .then(([loadedFrame, partnersResponse]) => {
        if (controller.signal.aborted) return
        setPartners(partnersResponse?.data ?? [])
        if (loadedFrame) {
          const layout = readFrameLayout(loadedFrame)
          setFrame(loadedFrame)
          setPartnerId(String(loadedFrame.partner?.id ?? ""))
          setName(loadedFrame.name)
          setStatus(loadedFrame.status)
          setSize(layout.size)
          setSlots(layout.slots)
          setSlotsInFront(layout.slotsInFront)
          setOverlayUrl(resolveStorageUrl(loadedFrame.png_path))
          nextSlotId.current = Math.max(0, ...layout.slots.map((slot) => slot.id)) + 1
        }
        setLoadState("ready")
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          void logout().then(() => navigate("/login", { replace: true, state: { from: location } }))
          return
        }
        if (error instanceof ApiError && error.status === 403) {
          navigate("/admin/forbidden", { replace: true, state: { from: location.pathname } })
          return
        }
        setFormError(error instanceof ApiError ? error.message : "Data Frame tidak dapat dimuat.")
        setLoadState("error")
      })

    return () => controller.abort()
  }, [editing, frameId, location, logout, navigate, superAdmin, token])

  useEffect(() => () => {
    if (overlayUrlRef.current) URL.revokeObjectURL(overlayUrlRef.current)
  }, [])

  /**
   * PNG ditampilkan dari objectURL lokal, bukan dari png_path hasil unggah — backend
   * belum punya endpoint penyaji asset, jadi URL storage-nya selalu gagal dimuat.
   * Unggahannya sendiri ditunda sampai Frame punya id (setelah simpan).
   */
  function pickOverlay(file: File) {
    if (overlayUrlRef.current) URL.revokeObjectURL(overlayUrlRef.current)
    overlayUrlRef.current = URL.createObjectURL(file)
    setOverlayUrl(overlayUrlRef.current)
    setOverlayFile(file)
    setOverlayBroken(false)
    setErrors((current) => ({ ...current, png: undefined }))
  }

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) ?? null
  const canvasSize = FRAME_SIZES[size]
  const displayHeight = 560
  const displayWidth = Math.round(displayHeight * canvasSize.width / canvasSize.height)

  function addSlot() {
    const slotWidth = Math.round(canvasSize.width * 0.8)
    const slotHeight = Math.round(canvasSize.height * 0.35)
    const offset = (slots.length % 4) * Math.round(Math.min(canvasSize.width, canvasSize.height) * 0.025)
    const slot: PhotoSlot = {
      id: nextSlotId.current++,
      x: clamp(Math.round(canvasSize.width * 0.1) + offset, 0, canvasSize.width - slotWidth),
      y: clamp(Math.round(canvasSize.height * 0.1) + offset, 0, canvasSize.height - slotHeight),
      width: slotWidth,
      height: slotHeight,
    }
    setSlots((current) => [...current, slot])
    setSelectedSlotId(slot.id)
    setErrors((current) => ({ ...current, slots: undefined }))
  }

  function updateSlot(slotId: number, updates: Partial<Omit<PhotoSlot, "id">>) {
    setSlots((current) => current.map((slot) => {
      if (slot.id !== slotId) return slot
      const next = { ...slot, ...updates }
      const width = clamp(next.width, 10, canvasSize.width)
      const height = clamp(next.height, 10, canvasSize.height)
      return {
        ...next,
        width,
        height,
        x: clamp(next.x, 0, canvasSize.width - width),
        y: clamp(next.y, 0, canvasSize.height - height),
      }
    }))
  }

  /** Salinan digeser sedikit supaya slot aslinya masih bisa diklik di canvas. */
  function duplicateSlot(source: PhotoSlot) {
    const step = Math.round(Math.min(canvasSize.width, canvasSize.height) * 0.03)
    const slot: PhotoSlot = {
      id: nextSlotId.current++,
      width: source.width,
      height: source.height,
      x: clamp(source.x + step, 0, canvasSize.width - source.width),
      y: clamp(source.y + step, 0, canvasSize.height - source.height),
    }
    setSlots((current) => [...current, slot])
    setSelectedSlotId(slot.id)
  }

  function removeSlot(slotId: number) {
    setSlots((current) => current.filter((slot) => slot.id !== slotId))
    setSelectedSlotId((current) => current === slotId ? null : current)
  }

  function changeSlotNumber(field: "x" | "y" | "width" | "height", value: string) {
    if (!selectedSlot) return
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return
    const maximum = field === "x" ? canvasSize.width - selectedSlot.width : field === "y" ? canvasSize.height - selectedSlot.height : field === "width" ? canvasSize.width - selectedSlot.x : canvasSize.height - selectedSlot.y
    updateSlot(selectedSlot.id, { [field]: clamp(parsed, field === "x" || field === "y" ? 0 : 10, maximum) })
  }

  function changeFrameSize(nextSize: FrameSize) {
    if (nextSize === size) return
    const previous = FRAME_SIZES[size]
    const next = FRAME_SIZES[nextSize]
    setSlots((current) => current.map((slot) => {
      const width = clamp(Math.round(slot.width * next.width / previous.width), 10, next.width)
      const height = clamp(Math.round(slot.height * next.height / previous.height), 10, next.height)
      return {
        ...slot,
        x: clamp(Math.round(slot.x * next.width / previous.width), 0, next.width - width),
        y: clamp(Math.round(slot.y * next.height / previous.height), 0, next.height - height),
        width,
        height,
      }
    }))
    setSize(nextSize)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || pending) return

    const nextErrors: FormErrors = {}
    if (!Number.isInteger(Number(partnerId)) || Number(partnerId) <= 0) nextErrors.partner_id = "Partner wajib dipilih."
    if (!name.trim()) nextErrors.name = "Nama Frame wajib diisi."
    else if (name.trim().length > 150) nextErrors.name = "Maksimal 150 karakter."
    if (!overlayUrl) nextErrors.png = "Unggah PNG frame terlebih dahulu."
    if (slots.length === 0) nextErrors.slots = "Tambahkan minimal satu slot foto."
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMode("edit")
      return
    }

    setPending(true)
    setErrors({})
    setFormError("")

    try {
      const currentCanvas = frame && isRecord(frame.json_layout) && isRecord(frame.json_layout.canvas) ? frame.json_layout.canvas : null
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
          canvas: { width: canvasSize.width, height: canvasSize.height, background: typeof currentCanvas?.background === "string" ? currentCanvas.background : "#ffffff" },
          paper_size: paperSizeForFrame(size),
          slots_on_top: slotsInFront,
          layout: determineLayout(slots),
          frames: slots.map((slot) => ({
            x: Math.round(slot.x),
            y: Math.round(slot.y),
            width: Math.round(slot.width),
            height: Math.round(slot.height),
          })),
        },
      }
      const saved = editing ? await updateTemplate(token, frameId, payload) : await createTemplate(token, payload)
      if (overlayFile) {
        try {
          await uploadTemplateAsset(token, saved.id, overlayFile, "png")
        } catch {
          setFormError(`Frame ${saved.name} tersimpan, tapi PNG gagal diunggah. Buka lagi Frame ini untuk mengulang unggahan.`)
          return
        }
      }
      toast.success(`Frame ${saved.name} ${editing ? "diperbarui" : "ditambahkan"}.`)
      navigate("/frame-photo", { replace: true })
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        await logout()
        navigate("/login", { replace: true, state: { from: location } })
        return
      }
      if (error instanceof ApiError && error.status === 403) {
        navigate("/admin/forbidden", { replace: true, state: { from: location.pathname } })
        return
      }
      if (error instanceof ApiError && error.status === 422) {
        setFormError(error.message || "Periksa kembali data Frame.")
        return
      }
      setFormError(error instanceof ApiError ? error.message : "Tidak dapat terhubung ke server.")
    } finally {
      setPending(false)
    }
  }

  if (loadState === "loading") {
    return <div className="grid min-h-96 place-items-center"><LoaderCircle className="size-8 animate-spin text-muted-foreground" aria-label="Memuat Frame" /></div>
  }

  if (loadState === "error") {
    return <div className="grid min-h-96 place-items-center p-6 text-center"><div><p className="font-medium">Frame tidak dapat dimuat</p><p className="mt-1 text-sm text-muted-foreground">{formError}</p><Button className="mt-4" type="button" variant="outline" onClick={() => navigate("/frame-photo")}>Kembali</Button></div></div>
  }

  return (
    <form className="min-w-0 space-y-5 p-4 sm:p-6 lg:p-8" onSubmit={(event) => void handleSubmit(event)} noValidate>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button type="button" size="icon" variant="outline" aria-label="Kembali ke daftar Frame" onClick={() => navigate("/frame-photo")}><ArrowLeft aria-hidden="true" /></Button>
          <div><h1 className="text-2xl font-semibold">{editing ? "Edit Frame" : "Frame Baru"}</h1><p className="mt-1 text-sm text-muted-foreground">Atur ukuran dan posisi slot foto tanpa menulis JSON.</p></div>
        </div>
        <div className="flex gap-2"><Button type="button" variant="outline" disabled={pending} onClick={() => navigate("/frame-photo")}>Batal</Button><Button type="submit" disabled={pending || (superAdmin && partners.length === 0)}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} Simpan Frame</Button></div>
      </header>

      <div className={cn("grid items-start gap-5", mode === "edit" && "xl:grid-cols-[minmax(0,1fr)_20rem]")}>
        <Card>
          <CardHeader className="border-b"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>{mode === "edit" ? "Editor Slot Foto" : "Preview Frame"}</CardTitle><CardDescription>{mode === "edit" ? "Tarik slot untuk mengatur posisi pada canvas." : "Preview menggunakan koordinat yang sama dengan hasil Electron."}</CardDescription></div><div className="flex flex-wrap gap-2"><div className="flex rounded-md border p-1"><Button type="button" size="sm" variant={mode === "edit" ? "secondary" : "ghost"} onClick={() => setMode("edit")}><Pencil aria-hidden="true" /> Edit</Button><Button type="button" size="sm" variant={mode === "preview" ? "secondary" : "ghost"} onClick={() => setMode("preview")}><Eye aria-hidden="true" /> Preview</Button></div>{mode === "edit" && <Button type="button" onClick={addSlot} disabled={!overlayUrl} title={overlayUrl ? undefined : "Unggah PNG frame dulu"}><Plus aria-hidden="true" /> Tambah Foto</Button>}</div></div></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{size}</Badge>
                <span className="text-xs text-muted-foreground">{canvasSize.width} x {canvasSize.height} px</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{slots.length} slot foto</span>
                {selectedSlot && mode === "edit" && <Badge variant="outline">Slot {slots.findIndex((slot) => slot.id === selectedSlot.id) + 1} dipilih</Badge>}
              </div>
            </div>
            <div className="grid min-h-136 place-items-center overflow-auto rounded-md border bg-zinc-100 p-5 dark:bg-zinc-950 sm:p-10">
              {mode === "edit" ? (
                <div className="relative overflow-hidden rounded-sm border-8 border-white bg-white shadow-2xl ring-1 ring-black/10">
                  <FrameCanvas canvasWidth={canvasSize.width} canvasHeight={canvasSize.height} displayWidth={displayWidth} displayHeight={displayHeight} overlayUrl={overlayUrl} slotsInFront={slotsInFront} slots={slots} selectedSlotId={selectedSlotId} onSelect={setSelectedSlotId} onChange={updateSlot} onOverlayError={() => setOverlayBroken(true)} />
                  {(!overlayUrl || overlayBroken) && (
                    <button type="button" onClick={() => overlayInputRef.current?.click()} className="absolute inset-3 grid place-items-center rounded-md border-2 border-dashed border-muted-foreground/40 bg-white/70 text-center transition-colors hover:border-primary hover:bg-primary/5">
                      <span className="grid gap-1 px-6">
                        <ImageUp className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                        <span className="font-medium">{overlayBroken ? "PNG tidak bisa dimuat" : "Unggah Image PNG"}</span>
                        <span className="text-xs text-muted-foreground">{overlayBroken ? "File tersimpan di server, tapi belum bisa diambil kembali. Klik untuk mengunggah ulang." : "Klik untuk memilih PNG frame. Slot foto bisa ditambahkan setelah gambar tampil di canvas."}</span>
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-sm border-8 border-white bg-white shadow-2xl ring-1 ring-black/10">
                  <div className="relative overflow-hidden bg-white" style={{ width: displayWidth, height: displayHeight }}>
                    {slots.map((slot, index) => (
                      <div key={slot.id} className="absolute overflow-hidden bg-muted ring-1 ring-black/10" style={{ left: `${(slot.x / canvasSize.width) * 100}%`, top: `${(slot.y / canvasSize.height) * 100}%`, width: `${(slot.width / canvasSize.width) * 100}%`, height: `${(slot.height / canvasSize.height) * 100}%`, zIndex: slotsInFront ? 2 : 1 }}><img src={samplePhoto} alt={`Contoh foto ${index + 1}`} className="size-full object-cover" style={{ objectPosition: index % 2 === 0 ? "center 25%" : "center 65%" }} /><span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-black/70 text-xs font-medium text-white">{index + 1}</span></div>
                    ))}
                    {overlayUrl && !overlayBroken && <img src={overlayUrl} alt="PNG frame" className="pointer-events-none absolute inset-0 size-full object-contain" style={{ zIndex: slotsInFront ? 1 : 2 }} />}
                    {slots.length === 0 && <div className="absolute inset-0 grid place-items-center p-6 text-center"><div><p className="font-medium text-muted-foreground">Canvas {size}</p><p className="mt-1 text-xs text-muted-foreground">{overlayUrl ? "Klik Tambah Foto untuk membuat slot." : "Unggah PNG frame di mode Edit."}</p></div></div>}
                  </div>
                </div>
              )}
            </div>
            {errors.slots && <p className="mt-2 text-sm text-destructive">{errors.slots}</p>}
          </CardContent>
        </Card>

        {mode === "edit" && <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Pengaturan Frame</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              {superAdmin && <div className="grid gap-2"><Label htmlFor="create-frame-partner">Partner/Kiosk</Label><Select<string> value={partnerId || null} onValueChange={(value) => { if (value !== null) { setPartnerId(value); setErrors((current) => ({ ...current, partner_id: undefined })) } }}><SelectTrigger id="create-frame-partner" className="w-full" aria-invalid={Boolean(errors.partner_id)}><SelectValue placeholder="Pilih Partner" /></SelectTrigger><SelectContent>{partners.map((partner) => <SelectItem key={partner.id} value={String(partner.id)}>{partner.brand_name || partner.company_name}</SelectItem>)}</SelectContent></Select>{errors.partner_id && <p className="text-xs text-destructive">{errors.partner_id}</p>}</div>}
              <div className="grid gap-2"><Label htmlFor="create-frame-name">Nama</Label><Input id="create-frame-name" value={name} maxLength={150} placeholder="Contoh: Frame Wedding" aria-invalid={Boolean(errors.name)} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })) }} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
              <div className="grid gap-2"><Label htmlFor="create-frame-size">Ukuran</Label><Select<FrameSize> value={size} onValueChange={(value) => value !== null && changeFrameSize(value)}><SelectTrigger id="create-frame-size" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{TEMPLATE_PAPER_SIZES.map((paperSize) => { const frameSize = paperSize === "2r" ? "2R" : "4R"; return <SelectItem key={paperSize} value={frameSize}>{FRAME_SIZES[frameSize].label}</SelectItem> })}</SelectContent></Select><p className="text-xs text-muted-foreground">Hasil final {canvasSize.width} x {canvasSize.height} px, tampilan editor diperkecil otomatis.</p></div>
              <div className="grid gap-2"><Label htmlFor="create-frame-status">Status</Label><Select<TemplateStatus> value={status} onValueChange={(value) => value !== null && setStatus(value)}><SelectTrigger id="create-frame-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Gambar Frame</CardTitle><CardDescription>PNG maksimal 10 MB, digambar sesuai canvas {canvasSize.width} x {canvasSize.height} px.</CardDescription></CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-3">
                <input
                  ref={overlayInputRef}
                  type="file"
                  accept="image/png"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) pickOverlay(file)
                    event.target.value = ""
                  }}
                />
                <div className="flex items-center gap-3">
                  <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted/40">
                    {overlayUrl && !overlayBroken
                      ? <img src={overlayUrl} alt="PNG frame saat ini" className="size-full object-contain" onError={() => setOverlayBroken(true)} />
                      : <ImageUp className="size-5 text-muted-foreground" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">PNG Frame</p>
                    {overlayBroken && <p className="mt-0.5 text-xs text-amber-600">Tersimpan, tapi backend belum menyajikannya kembali. Unggah ulang bila ingin melihatnya di editor.</p>}
                    <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => overlayInputRef.current?.click()}>
                      <ImageUp aria-hidden="true" /> {overlayUrl ? "Ganti" : "Unggah"} PNG
                    </Button>
                  </div>
                </div>
                {errors.png && <p className="text-xs text-destructive">{errors.png}</p>}
              </div>

              <fieldset className="grid gap-2" disabled={!overlayUrl}>
                <legend className="text-sm font-medium">Urutan Slot Foto</legend>
                <p className="text-xs text-muted-foreground">Posisi slot foto terhadap PNG saat dicetak.</p>
                {([
                  { value: false, label: "Slot di belakang PNG", hint: "PNG menutupi foto — untuk frame berbingkai." },
                  { value: true, label: "Slot di depan PNG", hint: "Foto menutupi PNG — untuk background polos." },
                ] as const).map((option) => (
                  <label key={String(option.value)} className={cn("flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-sm", slotsInFront === option.value && "border-primary bg-primary/5")}>
                    <input type="radio" name="slot-z-index" className="mt-0.5" checked={slotsInFront === option.value} onChange={() => setSlotsInFront(option.value)} />
                    <span className="min-w-0"><span className="font-medium">{option.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span></span>
                  </label>
                ))}
              </fieldset>

              {editing && frame
                ? ASSET_FIELDS.map((field) => (
                    <AssetUpload
                      key={field.type}
                      templateId={frame.id}
                      type={field.type}
                      label={field.label}
                      hint={field.hint}
                      currentPath={field.type === "preview" ? frame.preview_path : frame.thumbnail_path}
                      onUploaded={(saved) => { setFrame(saved); setFormError("") }}
                      onFailed={setFormError}
                    />
                  ))
                : <p className="text-sm text-muted-foreground">Preview dan thumbnail bisa diunggah setelah Frame tersimpan.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Slot Foto</CardTitle><CardDescription>{slots.length} slot dibuat</CardDescription></div>{selectedSlot && <div className="flex gap-2"><Button type="button" size="icon" variant="outline" aria-label="Duplikat slot terpilih" title="Duplikat slot (ukuran sama)" onClick={() => duplicateSlot(selectedSlot)}><Copy aria-hidden="true" /></Button><Button type="button" size="icon" variant="destructive" aria-label="Hapus slot terpilih" onClick={() => removeSlot(selectedSlot.id)}><Trash2 aria-hidden="true" /></Button></div>}</div></CardHeader>
            <CardContent>
              {!selectedSlot && <p className="text-sm text-muted-foreground">Pilih slot pada canvas untuk mengatur ukuran dan posisinya.</p>}
              {selectedSlot && <div className="grid grid-cols-2 gap-3">{(["x", "y", "width", "height"] as const).map((field) => <div key={field} className="grid gap-2"><Label htmlFor={`slot-${field}`}>{field === "x" ? "Posisi X (px)" : field === "y" ? "Posisi Y (px)" : field === "width" ? "Lebar (px)" : "Tinggi (px)"}</Label><Input id={`slot-${field}`} type="number" min={field === "x" || field === "y" ? 0 : 10} max={field === "x" ? canvasSize.width - selectedSlot.width : field === "y" ? canvasSize.height - selectedSlot.height : field === "width" ? canvasSize.width - selectedSlot.x : canvasSize.height - selectedSlot.y} step={1} value={Math.round(selectedSlot[field])} onChange={(event) => changeSlotNumber(field, event.target.value)} /></div>)}</div>}
            </CardContent>
          </Card>

          {formError && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{formError}</p>}
        </div>}
      </div>
      <Toaster position="top-right" />
    </form>
  )
}
