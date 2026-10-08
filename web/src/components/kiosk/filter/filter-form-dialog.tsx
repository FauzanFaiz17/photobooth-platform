import { ImageUp, LoaderCircle, Upload } from "lucide-react"
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"

import samplePhoto from "@/assets/preview.webp"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/features/auth/auth-context"
import { filterPreviewStyle } from "@/features/filters/filter-preview"
import {
  estimateFilterPreset,
  isCubeFile,
  parseCubeLut,
} from "@/features/filters/lut-to-preset"
import { createFilter, updateFilter } from "@/features/filters/filter-service"
import type { FilterRecord } from "@/features/filters/filter.types"
import { ApiError } from "@/lib/api-client"

interface FilterFormState {
  name: string
  brightness: string
  contrast: string
  saturation: string
  sharpness: string
  white_balance: string
  intensity: string
  is_active: boolean
}

type FilterFormErrors = Partial<Record<keyof FilterFormState, string>>

const adjustmentFields = [
  ["brightness", "Brightness", -100, 100],
  ["contrast", "Contrast", -100, 100],
  ["saturation", "Saturation", -100, 100],
  ["sharpness", "Sharpness", -100, 100],
  ["white_balance", "White Balance", -100, 100],
] as const

function initialForm(filter: FilterRecord | null): FilterFormState {
  return {
    name: filter?.name ?? "",
    brightness: String(filter?.brightness ?? 0),
    contrast: String(filter?.contrast ?? 0),
    saturation: String(filter?.saturation ?? 0),
    sharpness: String(filter?.sharpness ?? 0),
    white_balance: String(filter?.white_balance ?? 0),
    intensity: String(filter?.intensity ?? 100),
    is_active: filter?.is_active ?? true,
  }
}

function validate(form: FilterFormState): FilterFormErrors {
  const errors: FilterFormErrors = {}
  if (!form.name.trim()) errors.name = "Nama Filter wajib diisi."
  else if (form.name.trim().length > 150) errors.name = "Maksimal 150 karakter."

  for (const [field] of adjustmentFields) {
    const value = Number(form[field])
    if (!Number.isFinite(value) || value < -100 || value > 100) errors[field] = "Nilai harus antara -100 sampai 100."
  }
  const intensity = Number(form.intensity)
  if (!Number.isFinite(intensity) || intensity < 0 || intensity > 100) errors.intensity = "Intensity harus antara 0 sampai 100."
  return errors
}

function mapValidationErrors(error: ApiError): FilterFormErrors {
  const errors: FilterFormErrors = {}
  const fields = initialForm(null)
  for (const [field, messages] of Object.entries(error.validationErrors)) {
    const [message] = messages
    if (message && field in fields) errors[field as keyof FilterFormState] = message
  }
  return errors
}

export function FilterFormDialog({
  partnerId,
  filter,
  template = null,
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
  onForbidden,
}: {
  readonly partnerId: number | null
  readonly filter: FilterRecord | null
  readonly template?: FilterRecord | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSaved: (filter: FilterRecord, isNew: boolean) => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const [form, setForm] = useState<FilterFormState>(() =>
    initialForm(filter ?? template)
  )
  const [errors, setErrors] = useState<FilterFormErrors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)
  const lutInputRef = useRef<HTMLInputElement | null>(null)
  const [lutInfo, setLutInfo] = useState("")
  const [lutError, setLutError] = useState("")
  const previewPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)

  async function handleLutFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setLutInfo("")
    setLutError("")

    if (!isCubeFile(file.name)) {
      setLutError("File harus berekstensi .cube.")
      return
    }

    try {
      const estimate = estimateFilterPreset(parseCubeLut(await file.text()))
      updateField("brightness", String(estimate.brightness))
      updateField("contrast", String(estimate.contrast))
      updateField("saturation", String(estimate.saturation))
      updateField("white_balance", String(estimate.white_balance))
      updateField("intensity", String(estimate.intensity))
      setLutInfo(`Nilai diisi dari LUT ${file.name}. File tidak disimpan.`)
    } catch (error: unknown) {
      setLutError(
        error instanceof Error ? error.message : "LUT tidak dapat dibaca."
      )
    }
  }

  useEffect(() => {
    return () => {
      if (previewPhotoUrl) URL.revokeObjectURL(previewPhotoUrl)
    }
  }, [previewPhotoUrl])

  function handlePreviewPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setPreviewPhotoUrl(URL.createObjectURL(file))
  }

  function updateField<Field extends keyof FilterFormState>(field: Field, value: FilterFormState[Field]) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!(field in current)) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || pending) return
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    setPending(true)
    setErrors({})
    setFormError("")
    const payload = {
      partner_id: partnerId,
      name: form.name.trim(),
      brightness: Number(form.brightness),
      contrast: Number(form.contrast),
      saturation: Number(form.saturation),
      sharpness: Number(form.sharpness),
      white_balance: Number(form.white_balance),
      intensity: Number(form.intensity),
      is_active: form.is_active,
    }

    try {
      const saved = filter ? await updateFilter(token, filter.id, payload) : await createFilter(token, payload)
      onSaved(saved, filter === null)
      onOpenChange(false)
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      if (error instanceof ApiError && error.status === 403) return onForbidden()
      if (error instanceof ApiError && error.status === 422) {
        const fieldErrors = mapValidationErrors(error)
        setErrors(fieldErrors)
        setFormError(Object.keys(fieldErrors).length ? "Periksa kembali isian yang ditandai." : error.message)
        return
      }
      setFormError(error instanceof ApiError ? error.message : "Tidak dapat terhubung ke server.")
    } finally {
      setPending(false)
    }
  }

  const previewFilter = filterPreviewStyle({
    brightness: Number(form.brightness) || 0,
    contrast: Number(form.contrast) || 0,
    saturation: Number(form.saturation) || 0,
    intensity: Number(form.intensity) || 0,
  })

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{filter ? "Edit Filter" : template ? "Duplikat Filter" : "Tambah Filter"}</DialogTitle>
          <DialogDescription>{partnerId === null ? "Filter Global tersedia sebagai referensi untuk semua Partner." : "Filter ini tersedia untuk seluruh Booth milik Partner yang sama."}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="grid gap-2">
            <Label htmlFor="filter-name">Nama Filter</Label>
            <Input id="filter-name" value={form.name} maxLength={150} aria-invalid={Boolean(errors.name)} onChange={(event) => updateField("name", event.target.value)} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid gap-2">
            <Label>LUT (.cube) <span className="text-muted-foreground">(opsional)</span></Label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={lutInputRef}
                type="file"
                accept=".cube"
                className="hidden"
                onChange={(event) => void handleLutFile(event)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => lutInputRef.current?.click()}>
                <Upload aria-hidden="true" /> Upload LUT
              </Button>
              <span className="text-xs text-muted-foreground">
                Nilai akan diisi dari LUT; file tidak disimpan.
              </span>
            </div>
            {lutInfo && <p className="text-xs text-muted-foreground">{lutInfo}</p>}
            {lutError && <p role="alert" className="text-xs text-destructive">{lutError}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Left: Sliders */}
            <div className="grid gap-4">
              {adjustmentFields.map(([field, label, min, max]) => (
                <div key={field} className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`filter-${field}`}>{label}</Label>
                    <span className="text-xs tabular-nums text-muted-foreground">{form[field]}</span>
                  </div>
                  <Slider
                    id={`filter-${field}`}
                    min={min}
                    max={max}
                    step={1}
                    value={Number(form[field]) || 0}
                    onValueChange={(value) => updateField(field, String(value))}
                  />
                </div>
              ))}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="filter-intensity">Intensity</Label>
                  <span className="text-xs tabular-nums text-muted-foreground">{form.intensity}</span>
                </div>
                <Slider
                  id="filter-intensity"
                  min={0}
                  max={100}
                  step={1}
                  value={Number(form.intensity) || 0}
                  onValueChange={(value) => updateField("intensity", String(value))}
                />
              </div>
            </div>

            {/* Right: Preview */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Pratinjau</Label>
                <div className="flex items-center gap-1">
                  <input
                    ref={previewPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePreviewPhoto}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => previewPhotoInputRef.current?.click()}
                  >
                    <ImageUp aria-hidden="true" /> Foto
                  </Button>
                  {previewPhotoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewPhotoUrl(null)}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
              <div
                className="relative overflow-hidden rounded-lg border"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(rgba(0,0,0,0.06) 0% 25%, transparent 0% 50%)",
                  backgroundSize: "16px 16px",
                }}
              >
                <img
                  src={previewPhotoUrl ?? samplePhoto}
                  alt="Pratinjau filter"
                  className="w-full object-contain"
                  style={{ filter: previewFilter }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Pratinjau memakai CSS (brightness, contrast, saturation). Foto
                pratinjau hanya lokal, tidak disimpan.
              </p>
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 rounded-lg border p-4 text-sm">
            Filter aktif
            <Switch checked={form.is_active} onCheckedChange={(checked) => updateField("is_active", checked)} />
          </label>

          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {filter ? "Simpan perubahan" : template ? "Duplikat Filter" : "Tambah Filter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
