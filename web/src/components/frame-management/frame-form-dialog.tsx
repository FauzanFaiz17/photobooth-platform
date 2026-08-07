import { LoaderCircle } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/auth/auth-context"
import type { PartnerRecord } from "@/features/partners/partner.types"
import { createTemplate, updateTemplate } from "@/features/templates/template-service"
import type { TemplateLayout, TemplateRecord, TemplateStatus } from "@/features/templates/template.types"
import { ApiError } from "@/lib/api-client"

interface FrameFormState {
  partner_id: string
  name: string
  status: TemplateStatus
  preview_path: string
  thumbnail_path: string
  png_path: string
  psd_path: string
  json_layout: string
}

type FrameFormErrors = Partial<Record<keyof FrameFormState, string>>

const pathFields = [
  ["preview_path", "Preview path", "frames/preview/frame.jpg"],
  ["thumbnail_path", "Thumbnail path", "frames/thumbnails/frame.jpg"],
  ["png_path", "PNG path", "frames/frame.png"],
  ["psd_path", "PSD path", "frames/frame.psd"],
] as const

function initialForm(frame: TemplateRecord | null, partnerId: number | null): FrameFormState {
  return {
    partner_id: String(frame?.partner?.id ?? partnerId ?? ""),
    name: frame?.name ?? "",
    status: frame?.status ?? "draft",
    preview_path: frame?.preview_path ?? "",
    thumbnail_path: frame?.thumbnail_path ?? "",
    png_path: frame?.png_path ?? "",
    psd_path: frame?.psd_path ?? "",
    json_layout: JSON.stringify(frame?.json_layout ?? [], null, 2),
  }
}

function parseLayout(value: string): TemplateLayout | null {
  try {
    const parsed: unknown = JSON.parse(value)
    return typeof parsed === "object" && parsed !== null ? parsed as TemplateLayout : null
  } catch {
    return null
  }
}

function validate(form: FrameFormState): FrameFormErrors {
  const errors: FrameFormErrors = {}
  if (!Number.isInteger(Number(form.partner_id)) || Number(form.partner_id) <= 0) errors.partner_id = "Partner wajib dipilih."
  if (!form.name.trim()) errors.name = "Nama Frame wajib diisi."
  else if (form.name.trim().length > 150) errors.name = "Maksimal 150 karakter."
  for (const [field] of pathFields) if (form[field].trim().length > 255) errors[field] = "Maksimal 255 karakter."
  if (!parseLayout(form.json_layout)) errors.json_layout = "JSON layout harus berupa object atau array JSON yang valid."
  return errors
}

function mapValidationErrors(error: ApiError): FrameFormErrors {
  const errors: FrameFormErrors = {}
  const fields = initialForm(null, null)
  for (const [field, messages] of Object.entries(error.validationErrors)) {
    const [message] = messages
    if (message && field in fields) errors[field as keyof FrameFormState] = message
  }
  return errors
}

export function FrameFormDialog({
  frame,
  partners,
  defaultPartnerId,
  showPartnerSelect,
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
  onForbidden,
}: {
  readonly frame: TemplateRecord | null
  readonly partners: ReadonlyArray<PartnerRecord>
  readonly defaultPartnerId: number | null
  readonly showPartnerSelect: boolean
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSaved: (frame: TemplateRecord, isNew: boolean) => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const [form, setForm] = useState<FrameFormState>(() => initialForm(frame, defaultPartnerId))
  const [errors, setErrors] = useState<FrameFormErrors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)

  function updateField<Field extends keyof FrameFormState>(field: Field, value: FrameFormState[Field]) {
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
    const layout = parseLayout(form.json_layout)
    if (!layout) return

    setPending(true)
    setErrors({})
    setFormError("")
    const payload = {
      partner_id: Number(form.partner_id),
      name: form.name.trim(),
      status: form.status,
      preview_path: form.preview_path.trim() || null,
      thumbnail_path: form.thumbnail_path.trim() || null,
      png_path: form.png_path.trim() || null,
      psd_path: form.psd_path.trim() || null,
      json_layout: layout,
    }

    try {
      const saved = frame ? await updateTemplate(token, frame.id, payload) : await createTemplate(token, payload)
      onSaved(saved, frame === null)
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
        <DialogHeader><DialogTitle>{frame ? "Edit Frame" : "Tambah Frame"}</DialogTitle><DialogDescription>Backend menyimpan Frame sebagai Template konfigurasi Event.</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
          {showPartnerSelect && <div className="grid gap-2"><Label htmlFor="frame-partner">Partner/Kiosk</Label><Select<string> value={form.partner_id || null} onValueChange={(value) => value !== null && updateField("partner_id", value)}><SelectTrigger id="frame-partner" className="w-full" aria-invalid={Boolean(errors.partner_id)}><SelectValue placeholder="Pilih Partner" /></SelectTrigger><SelectContent>{partners.map((partner) => <SelectItem key={partner.id} value={String(partner.id)}>{partner.brand_name || partner.company_name}</SelectItem>)}</SelectContent></Select>{errors.partner_id && <p className="text-xs text-destructive">{errors.partner_id}</p>}</div>}
          <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="frame-name">Nama Frame</Label><Input id="frame-name" value={form.name} maxLength={150} aria-invalid={Boolean(errors.name)} onChange={(event) => updateField("name", event.target.value)} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div><div className="grid gap-2"><Label htmlFor="frame-status">Status</Label><Select<TemplateStatus> value={form.status} onValueChange={(value) => value !== null && updateField("status", value)}><SelectTrigger id="frame-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div></div>
          <div className="grid gap-4 sm:grid-cols-2">{pathFields.map(([field, label, placeholder]) => <div key={field} className="grid gap-2"><Label htmlFor={`frame-${field}`}>{label}</Label><Input id={`frame-${field}`} value={form[field]} maxLength={255} placeholder={placeholder} aria-invalid={Boolean(errors[field])} onChange={(event) => updateField(field, event.target.value)} />{errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}</div>)}</div>
          <div className="grid gap-2"><Label htmlFor="frame-layout">JSON layout</Label><Textarea id="frame-layout" className="min-h-48 font-mono text-xs" value={form.json_layout} aria-invalid={Boolean(errors.json_layout)} onChange={(event) => updateField("json_layout", event.target.value)} />{errors.json_layout && <p className="text-xs text-destructive">{errors.json_layout}</p>}</div>
          <p className="rounded-lg border p-3 text-sm text-muted-foreground">Upload file belum tersedia di backend. Path aset diisi sebagai teks dan tidak mengunggah file dari browser.</p>
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Batal</Button><Button type="submit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}{frame ? "Simpan perubahan" : "Tambah Frame"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
