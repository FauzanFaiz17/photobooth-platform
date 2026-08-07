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
import { useAuth } from "@/features/auth/auth-context"
import {
  createBooth,
  updateBooth,
} from "@/features/booths/booth-service"
import type {
  BoothRecord,
  BoothStatus,
} from "@/features/booths/booth.types"
import { ApiError } from "@/lib/api-client"

interface BoothFormState {
  name: string
  location: string
  status: BoothStatus
}

type BoothFormErrors = Partial<Record<keyof BoothFormState, string>>

function validate(form: BoothFormState): BoothFormErrors {
  const errors: BoothFormErrors = {}

  if (!form.name.trim()) errors.name = "Nama booth wajib diisi."
  if (form.name.trim().length > 150) {
    errors.name = "Nama booth maksimal 150 karakter."
  }
  if (form.location.trim().length > 255) {
    errors.location = "Lokasi maksimal 255 karakter."
  }

  return errors
}

function mapValidationErrors(error: ApiError): BoothFormErrors {
  const errors: BoothFormErrors = {}

  for (const [field, messages] of Object.entries(error.validationErrors)) {
    const [message] = messages
    if (
      message &&
      (field === "name" || field === "location" || field === "status")
    ) {
      errors[field] = message
    }
  }

  return errors
}

interface BoothFormDialogProps {
  readonly partnerId: number
  readonly partnerName: string
  readonly booth: BoothRecord | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSaved: (booth: BoothRecord, isNew: boolean) => void
  readonly onUnauthorized: () => void
}

export function BoothFormDialog({
  partnerId,
  partnerName,
  booth,
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
}: BoothFormDialogProps) {
  const { token } = useAuth()
  const [form, setForm] = useState<BoothFormState>({
    name: booth?.name ?? "",
    location: booth?.location ?? "",
    status: booth?.status ?? "active",
  })
  const [errors, setErrors] = useState<BoothFormErrors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)

  function updateField<Field extends keyof BoothFormState>(
    field: Field,
    value: BoothFormState[Field]
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
      setFormError("")
      return
    }

    setPending(true)
    setErrors({})
    setFormError("")

    const payload = {
      name: form.name.trim(),
      location: form.location.trim() || null,
      status: form.status,
    }

    try {
      const savedBooth = booth
        ? await updateBooth(token, booth.id, payload)
        : await createBooth(token, { ...payload, partner_id: partnerId })

      onSaved(savedBooth, booth === null)
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

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{booth ? "Edit booth" : "Tambah booth"}</DialogTitle>
          <DialogDescription>
            {booth
              ? `Perbarui booth milik ${partnerName}.`
              : `Tambahkan unit booth baru untuk ${partnerName}.`}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="booth-name">Nama booth</Label>
            <Input
              id="booth-name"
              value={form.name}
              maxLength={150}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => updateField("name", event.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booth-location">Lokasi</Label>
            <Input
              id="booth-location"
              value={form.location}
              maxLength={255}
              placeholder="Opsional"
              aria-invalid={Boolean(errors.location)}
              onChange={(event) =>
                updateField("location", event.target.value)
              }
            />
            {errors.location && (
              <p className="text-xs text-destructive">{errors.location}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booth-status">Status</Label>
            <Select<BoothStatus>
              value={form.status}
              onValueChange={(value) => {
                if (value !== null) updateField("status", value)
              }}
            >
              <SelectTrigger id="booth-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-xs text-destructive">{errors.status}</p>
            )}
          </div>

          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              )}
              {booth ? "Simpan perubahan" : "Tambah booth"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
