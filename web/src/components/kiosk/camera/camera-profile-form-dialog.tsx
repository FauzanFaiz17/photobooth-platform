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
  createCameraProfile,
  updateCameraProfile,
} from "@/features/camera-profiles/camera-profile-service"
import type { CameraProfileRecord } from "@/features/camera-profiles/camera-profile.types"
import { ApiError } from "@/lib/api-client"

interface CameraFormState {
  name: string
  iso: string
  shutter_speed: string
  aperture: string
  white_balance: string
  exposure: string
  focus_mode: string
  countdown_seconds: string
  burst_count: string
  image_quality: string
  live_view: boolean
  is_active: boolean
}

type CameraFormErrors = Partial<Record<keyof CameraFormState, string>>

const stringFields = [
  "name",
  "iso",
  "shutter_speed",
  "aperture",
  "white_balance",
  "exposure",
  "focus_mode",
  "image_quality",
] as const

function nullable(value: string): string | null {
  return value.trim() || null
}

function validate(form: CameraFormState): CameraFormErrors {
  const errors: CameraFormErrors = {}
  const countdown = Number(form.countdown_seconds)
  const burst = Number(form.burst_count)

  if (!form.name.trim()) errors.name = "Nama profile wajib diisi."
  if (form.name.trim().length > 150) errors.name = "Maksimal 150 karakter."

  for (const field of stringFields) {
    const max = field === "focus_mode" ? 30 : field === "name" ? 150 : 20
    if (form[field].trim().length > max) {
      errors[field] = `Maksimal ${max} karakter.`
    }
  }

  if (![2, 3, 5].includes(countdown)) {
    errors.countdown_seconds = "Pilih countdown 2, 3, atau 5 detik."
  }
  if (!Number.isInteger(burst) || burst < 1 || burst > 20) {
    errors.burst_count = "Burst harus antara 1–20 foto."
  }

  return errors
}

function mapValidationErrors(error: ApiError): CameraFormErrors {
  const errors: CameraFormErrors = {}

  for (const [field, messages] of Object.entries(error.validationErrors)) {
    const [message] = messages
    if (message && field in initialForm(null)) {
      errors[field as keyof CameraFormState] = message
    }
  }

  return errors
}

function initialForm(profile: CameraProfileRecord | null): CameraFormState {
  return {
    name: profile?.name ?? "",
    iso: profile?.iso ?? "",
    shutter_speed: profile?.shutter_speed ?? "",
    aperture: profile?.aperture ?? "",
    white_balance: profile?.white_balance ?? "",
    exposure: profile?.exposure ?? "",
    focus_mode: profile?.focus_mode ?? "",
    countdown_seconds: String(profile?.countdown_seconds ?? 3),
    burst_count: String(profile?.burst_count ?? 1),
    image_quality: profile?.image_quality ?? "",
    live_view: profile?.live_view ?? true,
    is_active: profile?.is_active ?? true,
  }
}

interface CameraProfileFormDialogProps {
  readonly partnerId: number
  readonly profile: CameraProfileRecord | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSaved: (profile: CameraProfileRecord, isNew: boolean) => void
  readonly onUnauthorized: () => void
}

export function CameraProfileFormDialog({
  partnerId,
  profile,
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
}: CameraProfileFormDialogProps) {
  const { token } = useAuth()
  const [form, setForm] = useState<CameraFormState>(() => initialForm(profile))
  const [errors, setErrors] = useState<CameraFormErrors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)

  function updateField<Field extends keyof CameraFormState>(
    field: Field,
    value: CameraFormState[Field]
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
      name: form.name.trim(),
      iso: nullable(form.iso),
      shutter_speed: nullable(form.shutter_speed),
      aperture: nullable(form.aperture),
      white_balance: nullable(form.white_balance),
      exposure: nullable(form.exposure),
      focus_mode: nullable(form.focus_mode),
      countdown_seconds: Number(form.countdown_seconds),
      burst_count: Number(form.burst_count),
      image_quality: nullable(form.image_quality),
      live_view: form.live_view,
      is_active: form.is_active,
    }

    try {
      const savedProfile = profile
        ? await updateCameraProfile(token, profile.id, payload)
        : await createCameraProfile(token, payload)

      onSaved(savedProfile, profile === null)
      onOpenChange(false)
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized()
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
          : "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
      )
    } finally {
      setPending(false)
    }
  }

  const textInputs = [
    ["iso", "ISO", "Contoh: 100"],
    ["shutter_speed", "Shutter speed", "Contoh: 1/125"],
    ["aperture", "Aperture", "Contoh: f/5.6"],
    ["white_balance", "White balance", "Contoh: Auto"],
    ["exposure", "Exposure", "Contoh: +0.3"],
    ["focus_mode", "Focus mode", "Contoh: Auto"],
    ["image_quality", "Image quality", "Contoh: Fine"],
  ] as const

  return (
    <Dialog open={open} onOpenChange={(value) => !pending && onOpenChange(value)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {profile ? "Edit camera profile" : "Tambah camera profile"}
          </DialogTitle>
          <DialogDescription>
            Profile ini tersedia untuk seluruh Booth milik Partner yang sama.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid max-h-[65vh] gap-4 overflow-y-auto px-1"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="camera-name">Nama profile</Label>
            <Input
              id="camera-name"
              value={form.name}
              maxLength={150}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => updateField("name", event.target.value)}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {textInputs.map(([field, label, placeholder]) => (
              <div key={field} className="grid gap-2">
                <Label htmlFor={`camera-${field}`}>{label}</Label>
                <Input
                  id={`camera-${field}`}
                  value={form[field]}
                  placeholder={placeholder}
                  maxLength={field === "focus_mode" ? 30 : 20}
                  aria-invalid={Boolean(errors[field])}
                  onChange={(event) => updateField(field, event.target.value)}
                />
                {errors[field] && (
                  <p className="text-xs text-destructive">{errors[field]}</p>
                )}
              </div>
            ))}

            <div className="grid gap-2">
              <Label htmlFor="camera-countdown">Countdown (detik)</Label>
              <Select<string>
                value={form.countdown_seconds}
                onValueChange={(value) =>
                  value !== null && updateField("countdown_seconds", value)
                }
              >
                <SelectTrigger
                  id="camera-countdown"
                  className="w-full"
                  aria-invalid={Boolean(errors.countdown_seconds)}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 5].map((seconds) => (
                    <SelectItem key={seconds} value={String(seconds)}>
                      {seconds} detik
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.countdown_seconds && (
                <p className="text-xs text-destructive">
                  {errors.countdown_seconds}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="camera-burst">Burst count</Label>
              <Input
                id="camera-burst"
                type="number"
                min={1}
                max={20}
                value={form.burst_count}
                aria-invalid={Boolean(errors.burst_count)}
                onChange={(event) => updateField("burst_count", event.target.value)}
              />
              {errors.burst_count && (
                <p className="text-xs text-destructive">{errors.burst_count}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 text-sm">
              Live view
              <Switch
                checked={form.live_view}
                onCheckedChange={(checked) => updateField("live_view", checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              Profile aktif
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => updateField("is_active", checked)}
              />
            </label>
          </div>

          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {profile ? "Simpan perubahan" : "Tambah profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
