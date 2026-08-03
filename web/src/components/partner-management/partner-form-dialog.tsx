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
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/auth/auth-context"
import {
  createPartner,
  updatePartner,
} from "@/features/partners/partner-service"
import type {
  PartnerRecord,
  PartnerStatus,
} from "@/features/partners/partner.types"
import { ApiError } from "@/lib/api-client"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Panjang maksimum mengikuti StorePartnerRequest/UpdatePartnerRequest. */
const MAX_COMPANY_NAME = 150
const MAX_BRAND_NAME = 150
const MAX_PHONE = 30
const MAX_TAX_NUMBER = 50

interface PartnerFormState {
  company_name: string
  brand_name: string
  address: string
  phone: string
  email: string
  tax_number: string
  status: PartnerStatus
}

type PartnerFormErrors = Partial<Record<keyof PartnerFormState, string>>

const FORM_FIELDS = [
  "company_name",
  "brand_name",
  "address",
  "phone",
  "email",
  "tax_number",
  "status",
] as const

function isFormField(value: string): value is keyof PartnerFormState {
  return FORM_FIELDS.some((field) => field === value)
}

function createInitialState(partner: PartnerRecord | null): PartnerFormState {
  return {
    company_name: partner?.company_name ?? "",
    brand_name: partner?.brand_name ?? "",
    address: partner?.address ?? "",
    phone: partner?.phone ?? "",
    email: partner?.email ?? "",
    tax_number: partner?.tax_number ?? "",
    status: partner?.status ?? "trial",
  }
}

function toNullable(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

function validate(form: PartnerFormState): PartnerFormErrors {
  const errors: PartnerFormErrors = {}
  const companyName = form.company_name.trim()
  const email = form.email.trim()

  if (companyName.length === 0) {
    errors.company_name = "Nama perusahaan wajib diisi."
  } else if (companyName.length > MAX_COMPANY_NAME) {
    errors.company_name = `Maksimal ${MAX_COMPANY_NAME} karakter.`
  }

  if (form.brand_name.trim().length > MAX_BRAND_NAME) {
    errors.brand_name = `Maksimal ${MAX_BRAND_NAME} karakter.`
  }

  if (email.length === 0) {
    errors.email = "Email wajib diisi."
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Format email tidak valid."
  }

  if (form.phone.trim().length > MAX_PHONE) {
    errors.phone = `Maksimal ${MAX_PHONE} karakter.`
  }

  if (form.tax_number.trim().length > MAX_TAX_NUMBER) {
    errors.tax_number = `Maksimal ${MAX_TAX_NUMBER} karakter.`
  }

  return errors
}

function mapValidationErrors(error: ApiError): PartnerFormErrors {
  const errors: PartnerFormErrors = {}

  for (const [field, messages] of Object.entries(error.validationErrors)) {
    const [firstMessage] = messages
    if (isFormField(field) && firstMessage) {
      errors[field] = firstMessage
    }
  }

  return errors
}

interface PartnerFormDialogProps {
  /** null berarti mode tambah partner. */
  readonly partner: PartnerRecord | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSaved: (partner: PartnerRecord, isNew: boolean) => void
  readonly onUnauthorized: () => void
}

export function PartnerFormDialog({
  partner,
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
}: PartnerFormDialogProps) {
  const { token } = useAuth()
  const [form, setForm] = useState<PartnerFormState>(() =>
    createInitialState(partner)
  )
  const [errors, setErrors] = useState<PartnerFormErrors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)
  const isEditing = partner !== null

  function updateField<Field extends keyof PartnerFormState>(
    field: Field,
    value: PartnerFormState[Field]
  ) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
    setErrors((currentErrors) => {
      if (!(field in currentErrors)) return currentErrors

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      return nextErrors
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
      company_name: form.company_name.trim(),
      brand_name: toNullable(form.brand_name),
      address: toNullable(form.address),
      phone: toNullable(form.phone),
      email: form.email.trim(),
      tax_number: toNullable(form.tax_number),
      status: form.status,
    }

    try {
      const savedPartner = partner
        ? await updatePartner(token, partner.id, payload)
        : await createPartner(token, payload)

      onSaved(savedPartner, partner === null)
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
        if (pending) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit partner" : "Tambah partner"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui data partner. Slug diperbarui otomatis oleh server bila nama perusahaan berubah."
              : "Partner baru otomatis mendapat langganan Trial selama 30 hari."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid max-h-[60vh] gap-4 overflow-y-auto px-1"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="partner-company-name">
              Nama perusahaan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="partner-company-name"
              value={form.company_name}
              maxLength={MAX_COMPANY_NAME}
              autoComplete="organization"
              aria-invalid={Boolean(errors.company_name)}
              aria-describedby={
                errors.company_name ? "partner-company-name-error" : undefined
              }
              onChange={(event) =>
                updateField("company_name", event.target.value)
              }
            />
            {errors.company_name && (
              <p
                id="partner-company-name-error"
                className="text-xs text-destructive"
              >
                {errors.company_name}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="partner-brand-name">Nama brand</Label>
            <Input
              id="partner-brand-name"
              value={form.brand_name}
              maxLength={MAX_BRAND_NAME}
              placeholder="Opsional"
              aria-invalid={Boolean(errors.brand_name)}
              onChange={(event) =>
                updateField("brand_name", event.target.value)
              }
            />
            {errors.brand_name && (
              <p className="text-xs text-destructive">{errors.brand_name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="partner-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="partner-email"
              type="email"
              value={form.email}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "partner-email-error" : undefined
              }
              onChange={(event) => updateField("email", event.target.value)}
            />
            {errors.email && (
              <p id="partner-email-error" className="text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="partner-phone">Telepon</Label>
              <Input
                id="partner-phone"
                value={form.phone}
                maxLength={MAX_PHONE}
                autoComplete="tel"
                placeholder="Opsional"
                aria-invalid={Boolean(errors.phone)}
                onChange={(event) => updateField("phone", event.target.value)}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="partner-tax-number">NPWP</Label>
              <Input
                id="partner-tax-number"
                value={form.tax_number}
                maxLength={MAX_TAX_NUMBER}
                placeholder="Opsional"
                aria-invalid={Boolean(errors.tax_number)}
                onChange={(event) =>
                  updateField("tax_number", event.target.value)
                }
              />
              {errors.tax_number && (
                <p className="text-xs text-destructive">
                  {errors.tax_number}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="partner-address">Alamat</Label>
            <Textarea
              id="partner-address"
              value={form.address}
              placeholder="Opsional"
              aria-invalid={Boolean(errors.address)}
              onChange={(event) => updateField("address", event.target.value)}
            />
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="partner-status">
              Status {isEditing && <span className="text-destructive">*</span>}
            </Label>
            <Select<PartnerStatus>
              value={form.status}
              onValueChange={(value) => {
                if (value !== null) updateField("status", value)
              }}
            >
              <SelectTrigger
                id="partner-status"
                className="w-full"
                aria-label="Status partner"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
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

          <DialogFooter className="mt-2">
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
              {isEditing ? "Simpan perubahan" : "Tambah partner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
