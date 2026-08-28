import { ArrowLeft, Eye, Grip, LoaderCircle, Pencil, Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent, type PointerEvent, type ReactElement } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import samplePhoto from "@/assets/login-photobooth.webp"
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
import { createTemplate, getTemplate, updateTemplate } from "@/features/templates/template-service"
import { TEMPLATE_PAPER_SIZES, type TemplatePaperSize, type TemplateRecord, type TemplateStatus } from "@/features/templates/template.types"
import { ApiError } from "@/lib/api-client"
import { cn } from "@/lib/utils"

const FRAME_SIZES = {
  "2R": { width: 750, height: 1050, label: "2R (750 x 1050 px)" },
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
  slots?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

function detectFrameSize(width: number, height: number): FrameSize {
  return (Object.entries(FRAME_SIZES).find(([, option]) => option.width === width && option.height === height)?.[0] as FrameSize | undefined) ?? "4R"
}

function paperSizeForFrame(size: FrameSize): TemplatePaperSize {
  return size === "2R" ? "2r" : "4r"
}

function readFrameLayout(frame: TemplateRecord): { size: FrameSize; slots: ReadonlyArray<PhotoSlot> } {
  if (!isRecord(frame.json_layout)) return { size: "4R", slots: [] }
  const canvas = isRecord(frame.json_layout.canvas) ? frame.json_layout.canvas : null
  const width = positiveNumber(canvas?.width) ?? FRAME_SIZES["4R"].width
  const height = positiveNumber(canvas?.height) ?? FRAME_SIZES["4R"].height
  const size = frame.paper_size === "2r" ? "2R" : frame.paper_size === "4r" ? "4R" : detectFrameSize(width, height)
  const frames = Array.isArray(frame.json_layout.frames) ? frame.json_layout.frames : []
  const slots = frames.flatMap((item, index): ReadonlyArray<PhotoSlot> => {
    if (!isRecord(item)) return []
    const x = positiveNumber(item.x) ?? (item.x === 0 ? 0 : null)
    const y = positiveNumber(item.y) ?? (item.y === 0 ? 0 : null)
    const slotWidth = positiveNumber(item.width)
    const slotHeight = positiveNumber(item.height)
    if (x === null || y === null || slotWidth === null || slotHeight === null) return []
    return [{ id: index + 1, x: (x / width) * 100, y: (y / height) * 100, width: (slotWidth / width) * 100, height: (slotHeight / height) * 100 }]
  })
  return { size, slots }
}

function determineLayout(slots: ReadonlyArray<PhotoSlot>): "grid" | "strip" {
  if (slots.length < 2) return "grid"
  const centersX = slots.map((slot) => slot.x + slot.width / 2)
  const centersY = slots.map((slot) => slot.y + slot.height / 2)
  return Math.max(...centersY) - Math.min(...centersY) > Math.max(...centersX) - Math.min(...centersX) ? "strip" : "grid"
}

export function FrameCreatePage(): ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const { frameId: frameIdParam } = useParams<{ frameId: string }>()
  const { token, user, logout } = useAuth()
  const superAdmin = isSuperAdmin(user)
  const frameId = Number(frameIdParam)
  const editing = Number.isInteger(frameId) && frameId > 0
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const nextSlotId = useRef(1)
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
          nextSlotId.current = layout.slots.length + 1
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

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) ?? null
  const canvasSize = FRAME_SIZES[size]

  function addSlot() {
    const offset = (slots.length % 4) * 4
    const slot: PhotoSlot = { id: nextSlotId.current++, x: 10 + offset, y: 10 + offset, width: 80, height: 35 }
    setSlots((current) => [...current, slot])
    setSelectedSlotId(slot.id)
    setErrors((current) => ({ ...current, slots: undefined }))
  }

  function updateSlot(slotId: number, updates: Partial<Omit<PhotoSlot, "id">>) {
    setSlots((current) => current.map((slot) => slot.id === slotId ? { ...slot, ...updates } : slot))
  }

  function removeSlot(slotId: number) {
    setSlots((current) => current.filter((slot) => slot.id !== slotId))
    setSelectedSlotId((current) => current === slotId ? null : current)
  }

  function startDragging(event: PointerEvent<HTMLButtonElement>, slot: PhotoSlot) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    dragOffset.current = {
      x: event.clientX - rect.left - (slot.x / 100) * rect.width,
      y: event.clientY - rect.top - (slot.y / 100) * rect.height,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelectedSlotId(slot.id)
  }

  function dragSlot(event: PointerEvent<HTMLButtonElement>, slot: PhotoSlot) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    updateSlot(slot.id, {
      x: clamp(((event.clientX - rect.left - dragOffset.current.x) / rect.width) * 100, 0, 100 - slot.width),
      y: clamp(((event.clientY - rect.top - dragOffset.current.y) / rect.height) * 100, 0, 100 - slot.height),
    })
  }

  function changeSlotNumber(field: "x" | "y" | "width" | "height", value: string) {
    if (!selectedSlot) return
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return
    const maximum = field === "x" ? 100 - selectedSlot.width : field === "y" ? 100 - selectedSlot.height : field === "width" ? 100 - selectedSlot.x : 100 - selectedSlot.y
    updateSlot(selectedSlot.id, { [field]: clamp(parsed, 1, maximum) })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || pending) return

    const nextErrors: FormErrors = {}
    if (!Number.isInteger(Number(partnerId)) || Number(partnerId) <= 0) nextErrors.partner_id = "Partner wajib dipilih."
    if (!name.trim()) nextErrors.name = "Nama Frame wajib diisi."
    else if (name.trim().length > 150) nextErrors.name = "Maksimal 150 karakter."
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
          layout: determineLayout(slots),
          frames: slots.map((slot) => ({
            x: Math.round((slot.x / 100) * canvasSize.width),
            y: Math.round((slot.y / 100) * canvasSize.height),
            width: Math.round((slot.width / 100) * canvasSize.width),
            height: Math.round((slot.height / 100) * canvasSize.height),
          })),
        },
      }
      const saved = editing ? await updateTemplate(token, frameId, payload) : await createTemplate(token, payload)
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
          <CardHeader className="border-b"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>{mode === "edit" ? "Editor Slot Foto" : "Preview Frame"}</CardTitle><CardDescription>{mode === "edit" ? "Tarik slot untuk mengatur posisi pada canvas." : "Preview menggunakan koordinat yang sama dengan hasil Electron."}</CardDescription></div><div className="flex flex-wrap gap-2"><div className="flex rounded-md border p-1"><Button type="button" size="sm" variant={mode === "edit" ? "secondary" : "ghost"} onClick={() => setMode("edit")}><Pencil aria-hidden="true" /> Edit</Button><Button type="button" size="sm" variant={mode === "preview" ? "secondary" : "ghost"} onClick={() => setMode("preview")}><Eye aria-hidden="true" /> Preview</Button></div>{mode === "edit" && <Button type="button" onClick={addSlot}><Plus aria-hidden="true" /> Tambah Foto</Button>}</div></div></CardHeader>
          <CardContent>
            <div className="grid min-h-136 place-items-center overflow-auto rounded-lg border bg-muted/40 p-4 sm:p-8">
              <div
                ref={canvasRef}
                className="relative touch-none overflow-hidden border bg-white shadow-sm"
                style={{ aspectRatio: `${canvasSize.width} / ${canvasSize.height}`, width: `min(100%, ${Math.min(512, Math.round(680 * canvasSize.width / canvasSize.height))}px)` }}
              >
                {slots.map((slot, index) => mode === "preview" ? (
                  <div key={slot.id} className="absolute overflow-hidden bg-muted" style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.width}%`, height: `${slot.height}%` }}><img src={samplePhoto} alt={`Contoh foto ${index + 1}`} className="size-full object-cover" style={{ objectPosition: index % 2 === 0 ? "center 25%" : "center 65%" }} /><span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">{index + 1}</span></div>
                ) : (
                  <button key={slot.id} type="button" className={cn("absolute grid cursor-move touch-none place-items-center border-2 bg-muted/80 text-foreground", selectedSlotId === slot.id ? "border-primary ring-2 ring-primary/20" : "border-dashed border-muted-foreground/60")} style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.width}%`, height: `${slot.height}%` }} onPointerDown={(event) => startDragging(event, slot)} onPointerMove={(event) => dragSlot(event, slot)} onClick={() => setSelectedSlotId(slot.id)}><span className="flex items-center gap-1 text-xs font-medium sm:text-sm"><Grip className="size-4" aria-hidden="true" /> Foto {index + 1}</span></button>
                ))}
                {slots.length === 0 && <div className="absolute inset-0 grid place-items-center p-6 text-center"><div><p className="font-medium text-muted-foreground">Canvas {size}</p><p className="mt-1 text-xs text-muted-foreground">Klik Tambah Foto untuk membuat slot.</p></div></div>}
              </div>
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
              <div className="grid gap-2"><Label htmlFor="create-frame-size">Ukuran</Label><Select<FrameSize> value={size} onValueChange={(value) => value !== null && setSize(value)}><SelectTrigger id="create-frame-size" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{TEMPLATE_PAPER_SIZES.map((paperSize) => { const frameSize = paperSize === "2r" ? "2R" : "4R"; return <SelectItem key={paperSize} value={frameSize}>{FRAME_SIZES[frameSize].label}</SelectItem> })}</SelectContent></Select><p className="text-xs text-muted-foreground">Hasil final {canvasSize.width} x {canvasSize.height} px, tampilan editor diperkecil otomatis.</p></div>
              <div className="grid gap-2"><Label htmlFor="create-frame-status">Status</Label><Select<TemplateStatus> value={status} onValueChange={(value) => value !== null && setStatus(value)}><SelectTrigger id="create-frame-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Slot Foto</CardTitle><CardDescription>{slots.length} slot dibuat</CardDescription></div>{selectedSlot && <Button type="button" size="icon" variant="destructive" aria-label="Hapus slot terpilih" onClick={() => removeSlot(selectedSlot.id)}><Trash2 aria-hidden="true" /></Button>}</div></CardHeader>
            <CardContent>
              {!selectedSlot && <p className="text-sm text-muted-foreground">Pilih slot pada canvas untuk mengatur ukuran dan posisinya.</p>}
              {selectedSlot && <div className="grid grid-cols-2 gap-3">{(["x", "y", "width", "height"] as const).map((field) => <div key={field} className="grid gap-2"><Label htmlFor={`slot-${field}`}>{field === "x" ? "Posisi X (%)" : field === "y" ? "Posisi Y (%)" : field === "width" ? "Lebar (%)" : "Tinggi (%)"}</Label><Input id={`slot-${field}`} type="number" min={1} max={100} step={1} value={Math.round(selectedSlot[field])} onChange={(event) => changeSlotNumber(field, event.target.value)} /></div>)}</div>}
            </CardContent>
          </Card>

          {formError && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{formError}</p>}
        </div>}
      </div>
      <Toaster position="top-right" />
    </form>
  )
}
