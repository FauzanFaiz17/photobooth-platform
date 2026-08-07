import { LoaderCircle } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/features/auth/auth-context"
import {
  createPrinterProfile,
  updatePrinterProfile,
} from "@/features/printer-profiles/printer-profile-service"
import type {
  PrinterOrientation,
  PrinterProfileRecord,
} from "@/features/printer-profiles/printer-profile.types"
import { ApiError } from "@/lib/api-client"

interface PrinterFormState {
  printer_name: string
  copies: string
  paper_size: string
  orientation: PrinterOrientation
  auto_print: boolean
  border: boolean
  bleed: string
  delay_ms: string
  is_active: boolean
}

type PrinterFormErrors = Partial<Record<keyof PrinterFormState, string>>

function initialForm(profile: PrinterProfileRecord | null): PrinterFormState {
  return {
    printer_name: profile?.printer_name ?? "",
    copies: String(profile?.copies ?? 1),
    paper_size: profile?.paper_size ?? "4x6",
    orientation: profile?.orientation ?? "portrait",
    auto_print: profile?.auto_print ?? true,
    border: profile?.border ?? false,
    bleed: String(profile?.bleed ?? 0),
    delay_ms: String(profile?.delay_ms ?? 0),
    is_active: profile?.is_active ?? true,
  }
}

function validate(form: PrinterFormState): PrinterFormErrors {
  const errors: PrinterFormErrors = {}
  const copies = Number(form.copies)
  const bleed = Number(form.bleed)
  const delay = Number(form.delay_ms)

  if (!form.printer_name.trim()) {
    errors.printer_name = "Nama printer wajib diisi."
  } else if (form.printer_name.trim().length > 150) {
    errors.printer_name = "Maksimal 150 karakter."
  }
  if (!form.paper_size.trim()) {
    errors.paper_size = "Ukuran kertas wajib diisi."
  } else if (form.paper_size.trim().length > 30) {
    errors.paper_size = "Maksimal 30 karakter."
  }
  if (!Number.isInteger(copies) || copies < 1 || copies > 20) {
    errors.copies = "Jumlah salinan harus antara 1–20."
  }
  if (!Number.isFinite(bleed) || bleed < 0 || bleed > 100) {
    errors.bleed = "Bleed harus antara 0–100."
  }
  if (!Number.isInteger(delay) || delay < 0 || delay > 60000) {
    errors.delay_ms = "Delay harus antara 0–60000 ms."
  }

  return errors
}

function mapValidationErrors(error: ApiError): PrinterFormErrors {
  const errors: PrinterFormErrors = {}
  const fields = initialForm(null)

  for (const [field, messages] of Object.entries(error.validationErrors)) {
    const [message] = messages
    if (message && field in fields) {
      errors[field as keyof PrinterFormState] = message
    }
  }

  return errors
}

export function PrinterProfileFormDialog({
  partnerId,
  profile,
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
  onForbidden,
}: {
  readonly partnerId: number
  readonly profile: PrinterProfileRecord | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSaved: (profile: PrinterProfileRecord, isNew: boolean) => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const [form, setForm] = useState<PrinterFormState>(() => initialForm(profile))
  const [errors, setErrors] = useState<PrinterFormErrors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)

  function updateField<Field extends keyof PrinterFormState>(
    field: Field,
    value: PrinterFormState[Field]
  ) {
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
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setPending(true)
    setErrors({})
    setFormError("")

    const payload = {
      partner_id: partnerId,
      printer_name: form.printer_name.trim(),
      copies: Number(form.copies),
      paper_size: form.paper_size.trim(),
      orientation: form.orientation,
      auto_print: form.auto_print,
      border: form.border,
      bleed: Number(form.bleed),
      delay_ms: Number(form.delay_ms),
      is_active: form.is_active,
    }

    try {
      const savedProfile = profile
        ? await updatePrinterProfile(token, profile.id, payload)
        : await createPrinterProfile(token, payload)

      onSaved(savedProfile, profile === null)
      onOpenChange(false)
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized()
        return
      }
      if (error instanceof ApiError && error.status === 403) {
        onForbidden()
        return
      }
      if (error instanceof ApiError && error.status === 422) {
        const fieldErrors = mapValidationErrors(error)
        setErrors(fieldErrors)
        setFormError(
          Object.keys(fieldErrors).length > 0
            ? "Periksa kembali isian yang ditandai."
            : error.message
        )
        return
      }
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Tidak dapat terhubung ke server."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !pending && onOpenChange(value)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {profile ? "Edit printer profile" : "Tambah printer profile"}
          </DialogTitle>
          <DialogDescription>
            Profile ini tersedia untuk seluruh Booth milik Partner yang sama.
          </DialogDescription>
        </DialogHeader>

        <form className="grid max-h-[65vh] gap-4 overflow-y-auto px-1" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="grid gap-2">
            <Label htmlFor="printer-name">Nama printer</Label>
            <Input id="printer-name" value={form.printer_name} maxLength={150} aria-invalid={Boolean(errors.printer_name)} onChange={(event) => updateField("printer_name", event.target.value)} />
            {errors.printer_name && <p className="text-xs text-destructive">{errors.printer_name}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="printer-copies">Jumlah salinan</Label>
              <Input id="printer-copies" type="number" min={1} max={20} value={form.copies} aria-invalid={Boolean(errors.copies)} onChange={(event) => updateField("copies", event.target.value)} />
              {errors.copies && <p className="text-xs text-destructive">{errors.copies}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="printer-paper-size">Ukuran kertas</Label>
              <Input id="printer-paper-size" value={form.paper_size} maxLength={30} placeholder="Contoh: 4x6" aria-invalid={Boolean(errors.paper_size)} onChange={(event) => updateField("paper_size", event.target.value)} />
              {errors.paper_size && <p className="text-xs text-destructive">{errors.paper_size}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="printer-orientation">Orientasi</Label>
              <Select<PrinterOrientation> value={form.orientation} onValueChange={(value) => value !== null && updateField("orientation", value)}>
                <SelectTrigger id="printer-orientation" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="portrait">Portrait</SelectItem><SelectItem value="landscape">Landscape</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="printer-bleed">Bleed</Label>
              <Input id="printer-bleed" type="number" min={0} max={100} step="0.01" value={form.bleed} aria-invalid={Boolean(errors.bleed)} onChange={(event) => updateField("bleed", event.target.value)} />
              {errors.bleed && <p className="text-xs text-destructive">{errors.bleed}</p>}
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="printer-delay">Delay cetak (ms)</Label>
              <Input id="printer-delay" type="number" min={0} max={60000} value={form.delay_ms} aria-invalid={Boolean(errors.delay_ms)} onChange={(event) => updateField("delay_ms", event.target.value)} />
              {errors.delay_ms && <p className="text-xs text-destructive">{errors.delay_ms}</p>}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
            <label className="flex items-center justify-between gap-3 text-sm">Auto print<Switch checked={form.auto_print} onCheckedChange={(checked) => updateField("auto_print", checked)} /></label>
            <label className="flex items-center justify-between gap-3 text-sm">Border<Switch checked={form.border} onCheckedChange={(checked) => updateField("border", checked)} /></label>
            <label className="flex items-center justify-between gap-3 text-sm">Aktif<Switch checked={form.is_active} onCheckedChange={(checked) => updateField("is_active", checked)} /></label>
          </div>

          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}{profile ? "Simpan perubahan" : "Tambah profile"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
