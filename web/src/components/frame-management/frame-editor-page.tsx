import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Info,
  Layers3,
  Link as LinkIcon,
  Save,
  Trash2,
  Upload,
} from "lucide-react"
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Toaster } from "@/components/ui/sonner"

import { FrameEditorCanvas } from "./frame-editor-canvas"
import { frameSizeMeta, initialManagedFrames } from "./frame-management.data"
import type {
  FrameCanvasBackground,
  FrameEditorErrors,
  FrameEditorMode,
  FrameRotation,
  ManagedFrameKind,
  ManagedFrameSize,
  ManagedFrameSlot,
} from "./frame-management.types"

function isManagedFrameSize(value: string): value is ManagedFrameSize {
  return value === "2R" || value === "4R" || value === "square"
}

function createSlot(index: number): ManagedFrameSlot {
  return {
    id: `slot-new-${index}`,
    label: index,
    x: 8 + ((index - 1) % 2) * 48,
    y: 8 + (Math.floor((index - 1) / 2) % 3) * 30,
    width: 38,
    height: 24,
    layer: index - 1,
  }
}

export function FrameEditorPage(): ReactElement {
  const navigate = useNavigate()
  const { frameId } = useParams<{ frameId: string }>()
  const [searchParams] = useSearchParams()
  const existingFrame = initialManagedFrames.find((frame) => frame.id === frameId) ?? null
  const requestedKind: ManagedFrameKind = searchParams.get("type") === "gif" ? "gif" : "photo"
  const kind = existingFrame?.kind ?? requestedKind
  const inputRef = useRef<HTMLInputElement>(null)
  const sequence = useRef((existingFrame?.slots.length ?? 0) + 1)

  const [name, setName] = useState(existingFrame?.name ?? "")
  const [size, setSize] = useState<ManagedFrameSize>(existingFrame?.size ?? "2R")
  const [slots, setSlots] = useState<ReadonlyArray<ManagedFrameSlot>>(existingFrame?.slots ?? [])
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(existingFrame?.slots[0]?.id ?? null)
  const [assetName, setAssetName] = useState(existingFrame?.assetName ?? "")
  const [assetPreviewUrl, setAssetPreviewUrl] = useState<string | null>(null)
  const [mode, setMode] = useState<FrameEditorMode>("edit")
  const [background, setBackground] = useState<FrameCanvasBackground>("grid")
  const [rotation, setRotation] = useState<FrameRotation>(0)
  const [zoom, setZoom] = useState(100)
  const [qrEnabled, setQrEnabled] = useState(false)
  const [isAnimating, setIsAnimating] = useState(true)
  const [errors, setErrors] = useState<FrameEditorErrors>({})
  const [saved, setSaved] = useState(false)

  const orderedLayers = useMemo(
    () => [...slots].sort((first, second) => second.layer - first.layer),
    [slots]
  )

  if (frameId && !existingFrame) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <h1 className="text-xl font-semibold">Frame tidak ditemukan</h1>
            <p className="mt-1 text-sm opacity-70">ID frame yang dipilih tidak tersedia pada dummy data.</p>
            <Button className="mt-4" onClick={() => navigate("/frame")}>
              <ArrowLeft aria-hidden="true" /> Kembali ke Daftar Frame
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  function updateSlot(nextSlot: ManagedFrameSlot): void {
    setSlots((current) => current.map((slot) => slot.id === nextSlot.id ? nextSlot : slot))
    setSaved(false)
  }

  function addSlot(): void {
    const nextSlot = createSlot(sequence.current)
    sequence.current += 1
    setSlots((current) => [...current, nextSlot])
    setSelectedSlotId(nextSlot.id)
    setErrors((current) => ({ ...current, slots: undefined }))
    setSaved(false)
  }

  function removeSlot(id: string): void {
    setSlots((current) => current.filter((slot) => slot.id !== id))
    setSelectedSlotId((current) => current === id ? null : current)
    setSaved(false)
  }

  function moveLayer(id: string, direction: "up" | "down"): void {
    setSlots((current) => {
      const ascending = [...current].sort((first, second) => first.layer - second.layer)
      const currentIndex = ascending.findIndex((slot) => slot.id === id)
      const targetIndex = direction === "up" ? currentIndex + 1 : currentIndex - 1
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ascending.length) return current

      const currentLayer = ascending[currentIndex].layer
      const targetLayer = ascending[targetIndex].layer
      return current.map((slot) => {
        if (slot.id === ascending[currentIndex].id) return { ...slot, layer: targetLayer }
        if (slot.id === ascending[targetIndex].id) return { ...slot, layer: currentLayer }
        return slot
      })
    })
    setSaved(false)
  }

  function handleAsset(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    if (!file) return
    const expectedExtension = kind === "gif" ? ".gif" : ".png"
    const validType = kind === "gif"
      ? file.type === "image/gif" || file.name.toLocaleLowerCase("en-US").endsWith(".gif")
      : file.type === "image/png" || file.name.toLocaleLowerCase("en-US").endsWith(".png")

    if (!validType) {
      setErrors((current) => ({ ...current, asset: `Gunakan file ${expectedExtension.toUpperCase()}.` }))
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrors((current) => ({ ...current, asset: "Ukuran file maksimal 15 MB." }))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") return
      setAssetName(file.name)
      setAssetPreviewUrl(reader.result)
      setErrors((current) => ({ ...current, asset: undefined }))
      setSaved(false)
    }
    reader.readAsDataURL(file)
  }

  function handleSave(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const nextErrors: FrameEditorErrors = {
      name: name.trim().length < 3 ? "Nama frame minimal 3 karakter." : undefined,
      asset: assetName ? undefined : `Upload aset ${kind === "gif" ? "GIF" : "PNG"} terlebih dahulu.`,
      slots: slots.length === 0 ? "Tambahkan minimal satu slot foto." : undefined,
    }
    setErrors(nextErrors)

    if (nextErrors.name || nextErrors.asset || nextErrors.slots) {
      toast.error("Frame belum dapat disimpan. Periksa kembali pengaturannya.")
      return
    }

    setSaved(true)
    toast.success(existingFrame ? "Perubahan frame berhasil disimpan." : "Frame baru berhasil disimpan.")
  }

  return (
    <form className="min-w-0 space-y-5 p-4 sm:p-6 lg:p-8" onSubmit={handleSave} noValidate>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button type="button" variant="ghost" className="mb-2 -ml-2" onClick={() => navigate("/frame")}>
            <ArrowLeft aria-hidden="true" /> Daftar Frame
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {existingFrame ? "Ubah" : "Frame Baru"} {kind === "gif" ? "GIF" : ""}
          </h1>
          <p className="mt-1 text-sm opacity-70">
            {kind === "gif" ? "GIF direkomendasikan" : "PNG direkomendasikan"} · Maksimal 15 MB
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate("/frame")}>Batal</Button>
          <Button type="submit"><Save aria-hidden="true" /> Simpan Frame</Button>
        </div>
      </header>

      {saved && (
        <Alert>
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Frame tersimpan</AlertTitle>
          <AlertDescription>Dummy interaction berhasil. Perubahan tersimpan selama halaman editor aktif.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <FrameEditorCanvas
          kind={kind}
          size={size}
          slots={slots}
          selectedSlotId={selectedSlotId}
          mode={mode}
          background={background}
          rotation={rotation}
          zoom={zoom}
          qrEnabled={qrEnabled}
          assetPreviewUrl={assetPreviewUrl}
          assetName={assetName}
          isAnimating={isAnimating}
          onModeChange={setMode}
          onBackgroundChange={setBackground}
          onRotationChange={setRotation}
          onZoomChange={setZoom}
          onQrChange={setQrEnabled}
          onAnimationChange={setIsAnimating}
          onAddSlot={addSlot}
          onSelectSlot={setSelectedSlotId}
          onSlotChange={updateSlot}
          onUploadClick={() => inputRef.current?.click()}
        />

        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Pengaturan Frame</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="frame-editor-name">Nama</Label>
                <Input
                  id="frame-editor-name"
                  value={name}
                  placeholder="Masukkan nama frame"
                  aria-invalid={Boolean(errors.name)}
                  onChange={(event) => {
                    setName(event.target.value)
                    setErrors((current) => ({ ...current, name: undefined }))
                    setSaved(false)
                  }}
                />
                {errors.name && <p className="text-xs opacity-70" role="alert">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="frame-editor-size">Ukuran</Label>
                  <span className="flex items-center gap-1 text-xs opacity-70"><LinkIcon className="size-3" aria-hidden="true" /> Panduan ukuran</span>
                </div>
                <Select<ManagedFrameSize>
                  value={size}
                  onValueChange={(value) => {
                    if (value && isManagedFrameSize(value)) {
                      setSize(value)
                      setSaved(false)
                    }
                  }}
                >
                  <SelectTrigger id="frame-editor-size" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(frameSizeMeta) as ManagedFrameSize[]).map((frameSize) => (
                      <SelectItem key={frameSize} value={frameSize}>{frameSizeMeta[frameSize].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs opacity-70">Rekomendasi: {frameSizeMeta[size].resolution}</p>
              </div>

              <Alert>
                <Info aria-hidden="true" />
                <AlertDescription>Biarkan rotasi Normal saat mengatur slot, lalu pilih rotasi target setelah posisi selesai.</AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Slot Foto</Label>
                  <span className="text-xs tabular-nums opacity-70">{slots.length} slot</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <Button
                      key={slot.id}
                      type="button"
                      size="icon"
                      variant={selectedSlotId === slot.id ? "secondary" : "outline"}
                      onClick={() => setSelectedSlotId(slot.id)}
                    >
                      {slot.label}
                    </Button>
                  ))}
                  <Button type="button" size="icon" variant="outline" aria-label="Tambah slot foto" onClick={addSlot}>+</Button>
                </div>
                {errors.slots && <p className="text-xs opacity-70" role="alert">{errors.slots}</p>}
                <p className="text-xs opacity-70">Drag slot pada canvas untuk mengatur posisi. Gunakan handle pojok untuk mengubah ukuran.</p>
              </div>

              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept={kind === "gif" ? "image/gif,.gif" : "image/png,.png"}
                onChange={handleAsset}
              />
              <Button type="button" className="w-full" variant="outline" onClick={() => inputRef.current?.click()}>
                <Upload aria-hidden="true" />
                {assetName ? "Ganti Aset" : `Upload Frame ${kind === "gif" ? "GIF" : "PNG"}`}
              </Button>
              {assetName && <p className="break-all text-xs opacity-70">{assetName}</p>}
              {errors.asset && <p className="text-xs opacity-70" role="alert">{errors.asset}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layers3 className="size-4" aria-hidden="true" /> Urutan Layer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {orderedLayers.map((slot, index) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-2 rounded-lg border p-2"
                  onClick={() => setSelectedSlotId(slot.id)}
                >
                  <Badge variant="secondary">{slot.label}</Badge>
                  <span className="min-w-0 flex-1 text-xs">Layer {slot.layer}</span>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Naikkan slot ${slot.label}`} disabled={index === 0} onClick={() => moveLayer(slot.id, "up")}>
                    <ArrowUp aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Turunkan slot ${slot.label}`} disabled={index === orderedLayers.length - 1} onClick={() => moveLayer(slot.id, "down")}>
                    <ArrowDown aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Hapus slot ${slot.label}`} onClick={() => removeSlot(slot.id)}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ))}
              {orderedLayers.length === 0 && <p className="py-6 text-center text-sm opacity-70">Belum ada layer slot.</p>}
              <p className="pt-2 text-xs opacity-70">Layer teratas tampil paling depan pada canvas kiosk.</p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Toaster position="top-right" />
    </form>
  )
}
