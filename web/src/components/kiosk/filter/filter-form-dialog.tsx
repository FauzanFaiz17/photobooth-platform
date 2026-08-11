import { LoaderCircle } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/features/auth/auth-context"
import { createFilter, updateFilter } from "@/features/filters/filter-service"
import type { FilterRecord } from "@/features/filters/filter.types"
import { ApiError } from "@/lib/api-client"

interface FilterFormState {
  name: string
  lut_path: string
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
  ["brightness", "Brightness"],
  ["contrast", "Contrast"],
  ["saturation", "Saturation"],
  ["sharpness", "Sharpness"],
  ["white_balance", "White balance"],
] as const

function initialForm(filter: FilterRecord | null): FilterFormState {
  return {
    name: filter?.name ?? "",
    lut_path: filter?.lut_path ?? "",
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
  if (form.lut_path.trim().length > 255) errors.lut_path = "Maksimal 255 karakter."

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
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
  onForbidden,
}: {
  readonly partnerId: number
  readonly filter: FilterRecord | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSaved: (filter: FilterRecord, isNew: boolean) => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const [form, setForm] = useState<FilterFormState>(() => initialForm(filter))
  const [errors, setErrors] = useState<FilterFormErrors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)

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
      lut_path: form.lut_path.trim() || null,
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

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{filter ? "Edit Filter" : "Tambah Filter"}</DialogTitle><DialogDescription>Filter ini tersedia untuk seluruh Booth milik Partner yang sama.</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="grid gap-2"><Label htmlFor="filter-name">Nama Filter</Label><Input id="filter-name" value={form.name} maxLength={150} aria-invalid={Boolean(errors.name)} onChange={(event) => updateField("name", event.target.value)} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
          <div className="grid gap-2"><Label htmlFor="filter-lut">LUT path <span className="text-muted-foreground">(opsional)</span></Label><Input id="filter-lut" value={form.lut_path} maxLength={255} placeholder="Contoh: filters/warm.cube" aria-invalid={Boolean(errors.lut_path)} onChange={(event) => updateField("lut_path", event.target.value)} />{errors.lut_path && <p className="text-xs text-destructive">{errors.lut_path}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            {adjustmentFields.map(([field, label]) => <div key={field} className="grid gap-2"><Label htmlFor={`filter-${field}`}>{label}</Label><Input id={`filter-${field}`} type="number" min={-100} max={100} step="0.01" value={form[field]} aria-invalid={Boolean(errors[field])} onChange={(event) => updateField(field, event.target.value)} />{errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}</div>)}
            <div className="grid gap-2"><Label htmlFor="filter-intensity">Intensity</Label><Input id="filter-intensity" type="number" min={0} max={100} step="0.01" value={form.intensity} aria-invalid={Boolean(errors.intensity)} onChange={(event) => updateField("intensity", event.target.value)} />{errors.intensity && <p className="text-xs text-destructive">{errors.intensity}</p>}</div>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-4 text-sm">Filter aktif<Switch checked={form.is_active} onCheckedChange={(checked) => updateField("is_active", checked)} /></label>
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Batal</Button><Button type="submit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}{filter ? "Simpan perubahan" : "Tambah Filter"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
