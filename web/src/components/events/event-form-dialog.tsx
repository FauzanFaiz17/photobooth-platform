import { LoaderCircle } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"

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
import type { BoothRecord } from "@/features/booths/booth.types"
import { useAuth } from "@/features/auth/auth-context"
import {
  createEvent,
  getEventConfigurationOptions,
  updateEvent,
} from "@/features/events/event-service"
import type {
  EventConfigurationOption,
  EventConfigurationOptions,
  EventRecord,
  EventStatus,
} from "@/features/events/event.types"
import { ApiError } from "@/lib/api-client"

interface EventFormState {
  booth_id: string
  event_name: string
  template_id: string
  filter_id: string
  camera_profile_id: string
  printer_profile_id: string
  event_date: string
  start_time: string
  end_time: string
  price: string
  print_count_limit: string
  status: EventStatus
}

type EventFormErrors = Partial<Record<keyof EventFormState, string>>

function initialForm(event: EventRecord | null): EventFormState {
  return {
    booth_id: event ? String(event.booth.id) : "",
    event_name: event?.event_name ?? "",
    template_id: event ? String(event.configuration.template.template_id) : "",
    filter_id: event ? String(event.configuration.filter.filter_id) : "",
    camera_profile_id: event ? String(event.configuration.camera.camera_profile_id) : "",
    printer_profile_id: event ? String(event.configuration.printer.printer_profile_id) : "",
    event_date: event?.event_date ?? "",
    start_time: event?.start_time.slice(0, 5) ?? "",
    end_time: event?.end_time.slice(0, 5) ?? "",
    price: event ? String(event.price) : "0",
    print_count_limit: event ? String(event.print_count_limit) : "0",
    status: event?.status ?? "draft",
  }
}

function validate(form: EventFormState, editing: boolean): EventFormErrors {
  const errors: EventFormErrors = {}
  const requiredIds: ReadonlyArray<keyof EventFormState> = editing
    ? []
    : ["booth_id", "template_id", "filter_id", "camera_profile_id", "printer_profile_id"]

  for (const field of requiredIds) {
    if (!Number.isInteger(Number(form[field])) || Number(form[field]) <= 0) {
      errors[field] = "Pilihan ini wajib diisi."
    }
  }
  if (!form.event_name.trim()) errors.event_name = "Nama Event wajib diisi."
  else if (form.event_name.trim().length > 150) errors.event_name = "Maksimal 150 karakter."
  if (!form.event_date) errors.event_date = "Tanggal Event wajib diisi."
  if (!form.start_time) errors.start_time = "Jam mulai wajib diisi."
  if (!form.end_time) errors.end_time = "Jam selesai wajib diisi."
  else if (form.start_time && form.end_time <= form.start_time) errors.end_time = "Jam selesai harus setelah jam mulai."

  const price = Number(form.price)
  if (form.price.trim() !== "" && (!Number.isFinite(price) || price < 0)) errors.price = "Harga tidak boleh negatif."
  const printLimit = Number(form.print_count_limit)
  if (form.print_count_limit.trim() !== "" && (!Number.isInteger(printLimit) || printLimit < 0)) errors.print_count_limit = "Batas cetak harus bilangan bulat minimal 0."

  return errors
}

function mapValidationErrors(error: ApiError): EventFormErrors {
  const errors: EventFormErrors = {}
  const fields = initialForm(null)
  for (const [field, messages] of Object.entries(error.validationErrors)) {
    const [message] = messages
    if (message && field in fields) errors[field as keyof EventFormState] = message
  }
  return errors
}

function ConfigurationSelect({
  id,
  label,
  value,
  options,
  error,
  onChange,
}: {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly options: ReadonlyArray<EventConfigurationOption>
  readonly error?: string
  readonly onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select<string> value={value || null} onValueChange={(next) => next !== null && onChange(next)}>
        <SelectTrigger id={id} className="w-full" aria-invalid={Boolean(error)}><SelectValue placeholder={`Pilih ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>
          {options.map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name}{option.is_global ? " (Global)" : ""}</SelectItem>)}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function EventFormDialog({
  event,
  booths,
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
  onForbidden,
}: {
  readonly event: EventRecord | null
  readonly booths: ReadonlyArray<BoothRecord>
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSaved: (event: EventRecord, isNew: boolean) => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const [form, setForm] = useState<EventFormState>(() => initialForm(event))
  const [errors, setErrors] = useState<EventFormErrors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)
  const [configurationState, setConfigurationState] = useState<"idle" | "loading" | "success" | "error">(event ? "success" : "idle")
  const [options, setOptions] = useState<EventConfigurationOptions>({ templates: [], filters: [], cameras: [], printers: [] })

  const selectedBooth = booths.find((booth) => String(booth.id) === form.booth_id)

  useEffect(() => {
    if (event || !token || !selectedBooth) return
    const accessToken = token
    const partnerId = selectedBooth.partner.id
    const controller = new AbortController()

    async function loadOptions() {
      setConfigurationState("loading")
      setFormError("")
      try {
        const result = await getEventConfigurationOptions(accessToken, partnerId, controller.signal)
        if (controller.signal.aborted) return
        setOptions(result)
        setConfigurationState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) return onUnauthorized()
        if (error instanceof ApiError && error.status === 403) return onForbidden()
        setConfigurationState("error")
        setFormError(error instanceof ApiError ? error.message : "Konfigurasi Event gagal dimuat.")
      }
    }

    void loadOptions()

    return () => controller.abort()
  }, [event, onForbidden, onUnauthorized, selectedBooth, token])

  function updateField<Field extends keyof EventFormState>(field: Field, value: EventFormState[Field]) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!(field in current)) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function changeBooth(value: string) {
    setForm((current) => ({ ...current, booth_id: value, template_id: "", filter_id: "", camera_profile_id: "", printer_profile_id: "" }))
    setOptions({ templates: [], filters: [], cameras: [], printers: [] })
    setErrors({})
  }

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()
    if (!token || pending) return

    const validationErrors = validate(form, event !== null)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setPending(true)
    setErrors({})
    setFormError("")

    const common = {
      event_name: form.event_name.trim(),
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time,
      price: form.price.trim() === "" ? 0 : Number(form.price),
      print_count_limit: form.print_count_limit.trim() === "" ? 0 : Number(form.print_count_limit),
    }

    try {
      const saved = event
        ? await updateEvent(token, event.id, { ...common, status: form.status })
        : await createEvent(token, {
            ...common,
            booth_id: Number(form.booth_id),
            template_id: Number(form.template_id),
            filter_id: Number(form.filter_id),
            camera_profile_id: Number(form.camera_profile_id),
            printer_profile_id: Number(form.printer_profile_id),
            status: form.status === "scheduled" ? "scheduled" : "draft",
          })

      onSaved(saved, event === null)
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

  const configurationMissing = !event && configurationState === "success" && Object.values(options).some((items) => items.length === 0)

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Tambah Event"}</DialogTitle>
          <DialogDescription>{event ? "Konfigurasi snapshot tidak berubah saat jadwal Event diedit." : "Pilih Booth dan konfigurasi yang akan disalin menjadi snapshot Event."}</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={(submitEvent) => void handleSubmit(submitEvent)} noValidate>
          {!event && (
            <div className="grid gap-2">
              <Label htmlFor="event-booth">Booth</Label>
              <Select<string> value={form.booth_id || null} onValueChange={(value) => value !== null && changeBooth(value)}>
                <SelectTrigger id="event-booth" className="w-full" aria-invalid={Boolean(errors.booth_id)}><SelectValue placeholder="Pilih Booth" /></SelectTrigger>
                <SelectContent>{booths.map((booth) => <SelectItem key={booth.id} value={String(booth.id)}>{booth.name} — {booth.partner.brand_name || booth.partner.company_name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.booth_id && <p className="text-xs text-destructive">{errors.booth_id}</p>}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="event-name">Nama Event</Label>
            <Input id="event-name" value={form.event_name} maxLength={150} aria-invalid={Boolean(errors.event_name)} onChange={(inputEvent) => updateField("event_name", inputEvent.target.value)} />
            {errors.event_name && <p className="text-xs text-destructive">{errors.event_name}</p>}
          </div>

          {!event && selectedBooth && configurationState === "loading" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Memuat konfigurasi Partner...</p>}

          {!event && configurationState === "success" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <ConfigurationSelect id="event-template" label="Template" value={form.template_id} options={options.templates} error={errors.template_id} onChange={(value) => updateField("template_id", value)} />
              <ConfigurationSelect id="event-filter" label="Filter" value={form.filter_id} options={options.filters} error={errors.filter_id} onChange={(value) => updateField("filter_id", value)} />
              <ConfigurationSelect id="event-camera" label="Camera Profile" value={form.camera_profile_id} options={options.cameras} error={errors.camera_profile_id} onChange={(value) => updateField("camera_profile_id", value)} />
              <ConfigurationSelect id="event-printer" label="Printer Profile" value={form.printer_profile_id} options={options.printers} error={errors.printer_profile_id} onChange={(value) => updateField("printer_profile_id", value)} />
            </div>
          )}

          {configurationMissing && <p className="text-sm text-destructive">Event belum dapat dibuat karena salah satu konfigurasi aktif/published belum tersedia.</p>}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2"><Label htmlFor="event-date">Tanggal</Label><Input id="event-date" type="date" value={form.event_date} aria-invalid={Boolean(errors.event_date)} onChange={(inputEvent) => updateField("event_date", inputEvent.target.value)} />{errors.event_date && <p className="text-xs text-destructive">{errors.event_date}</p>}</div>
            <div className="grid gap-2"><Label htmlFor="event-start">Jam mulai</Label><Input id="event-start" type="time" value={form.start_time} aria-invalid={Boolean(errors.start_time)} onChange={(inputEvent) => updateField("start_time", inputEvent.target.value)} />{errors.start_time && <p className="text-xs text-destructive">{errors.start_time}</p>}</div>
            <div className="grid gap-2"><Label htmlFor="event-end">Jam selesai</Label><Input id="event-end" type="time" value={form.end_time} aria-invalid={Boolean(errors.end_time)} onChange={(inputEvent) => updateField("end_time", inputEvent.target.value)} />{errors.end_time && <p className="text-xs text-destructive">{errors.end_time}</p>}</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2"><Label htmlFor="event-price">Harga</Label><Input id="event-price" type="number" min={0} step="0.01" value={form.price} aria-invalid={Boolean(errors.price)} onChange={(inputEvent) => updateField("price", inputEvent.target.value)} />{errors.price && <p className="text-xs text-destructive">{errors.price}</p>}</div>
            <div className="grid gap-2"><Label htmlFor="event-print-limit">Batas cetak</Label><Input id="event-print-limit" type="number" min={0} step={1} value={form.print_count_limit} aria-invalid={Boolean(errors.print_count_limit)} onChange={(inputEvent) => updateField("print_count_limit", inputEvent.target.value)} />{errors.print_count_limit && <p className="text-xs text-destructive">{errors.print_count_limit}</p>}</div>
            <div className="grid gap-2"><Label htmlFor="event-status">Status</Label><Select<EventStatus> value={form.status} onValueChange={(value) => value !== null && updateField("status", value)}><SelectTrigger id="event-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{(event ? ["draft", "scheduled", "ongoing", "completed", "cancelled"] as const : ["draft", "scheduled"] as const).map((status) => <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>)}</SelectContent></Select></div>
          </div>

          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={pending || (!event && (configurationState !== "success" || configurationMissing))}>{pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}{event ? "Simpan perubahan" : "Tambah Event"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
