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
import { useAuth } from "@/features/auth/auth-context"
import { getPartners } from "@/features/partners/partner-service"
import type { PartnerRecord } from "@/features/partners/partner.types"
import {
  createUser,
  updateUser,
} from "@/features/users/user-service"
import type {
  UserRecord,
  UserStatus,
} from "@/features/users/user.types"
import { ApiError } from "@/lib/api-client"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NO_PARTNER = "none"

interface UserFormState {
  name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
  role_id: string
  partner_id: string
  status: UserStatus
}

type UserFormErrors = Partial<Record<keyof UserFormState, string>>

const FORM_FIELDS = [
  "name",
  "email",
  "phone",
  "password",
  "password_confirmation",
  "role_id",
  "partner_id",
  "status",
] as const

function isFormField(value: string): value is keyof UserFormState {
  return FORM_FIELDS.some((field) => field === value)
}

function validate(
  form: UserFormState,
  passwordRequired: boolean
): UserFormErrors {
  const errors: UserFormErrors = {}

  if (!form.name.trim()) errors.name = "Nama wajib diisi."
  if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Format email tidak valid."
  }
  if (form.phone.trim().length > 30) {
    errors.phone = "Maksimal 30 karakter."
  }
  if (
    (passwordRequired && form.password.length < 8) ||
    (form.password.length > 0 && form.password.length < 8)
  ) {
    errors.password = "Password minimal 8 karakter."
  }
  if (form.password_confirmation !== form.password) {
    errors.password_confirmation = "Konfirmasi password tidak sama."
  }

  const roleId = Number(form.role_id)
  if (!Number.isInteger(roleId) || roleId <= 0) {
    errors.role_id = "Role wajib dipilih."
  }

  return errors
}

function mapValidationErrors(error: ApiError): UserFormErrors {
  const errors: UserFormErrors = {}

  for (const [field, messages] of Object.entries(error.validationErrors)) {
    const [firstMessage] = messages
    if (isFormField(field) && firstMessage) errors[field] = firstMessage
  }

  return errors
}


interface UserCreateDialogProps {
  readonly user?: UserRecord
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSaved: (user: UserRecord, isNew: boolean) => void
  readonly onUnauthorized: () => void
}

export function UserCreateDialog({
  user,
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
}: UserCreateDialogProps) {
  const { token } = useAuth()
  const [form, setForm] = useState<UserFormState>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    password: "",
    password_confirmation: "",
    role_id: user?.role.id ? String(user.role.id) : "",
    partner_id: user?.partner ? String(user.partner.id) : NO_PARTNER,
    status: user?.status ?? "active",
  })
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([])
  const [errors, setErrors] = useState<UserFormErrors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open || !token) return

    const controller = new AbortController()

    getPartners(
      token,
      { sort: "company_name", direction: "asc", per_page: 100 },
      controller.signal
    )
      .then((response) => setPartners(response.data))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized()
          return
        }
        setFormError(
          error instanceof ApiError
            ? error.message
            : "Daftar partner tidak dapat dimuat."
        )
      })

    return () => controller.abort()
  }, [onUnauthorized, open, token])

  function updateField<Field extends keyof UserFormState>(
    field: Field,
    value: UserFormState[Field]
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

    const validationErrors = validate(form, user === undefined)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setFormError("")
      return
    }

    setPending(true)
    setErrors({})
    setFormError("")

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role_id: Number(form.role_id),
        partner_id:
          form.partner_id === NO_PARTNER
            ? null
            : Number(form.partner_id),
        status: form.status,
        ...(form.password
          ? {
              password: form.password,
              password_confirmation: form.password_confirmation,
            }
          : {}),
      }

      const savedUser = user
        ? await updateUser(token, user.id, payload)
        : await createUser(token, {
            ...payload,
            password: form.password,
            password_confirmation: form.password_confirmation,
          })

      onSaved(savedUser, user === undefined)
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
          <DialogTitle>{user ? "Edit user" : "Tambah user"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Perbarui data akun pengguna. Kosongkan password jika tidak ingin menggantinya."
              : "Buat akun yang dapat login ketika statusnya Active."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid max-h-[65vh] gap-4 overflow-y-auto px-1"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="user-name">Nama</Label>
            <Input
              id="user-name"
              value={form.name}
              maxLength={150}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => updateField("name", event.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              onChange={(event) => updateField("email", event.target.value)}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-phone">Telepon</Label>
            <Input
              id="user-phone"
              value={form.phone}
              maxLength={30}
              autoComplete="tel"
              placeholder="Opsional"
              aria-invalid={Boolean(errors.phone)}
              onChange={(event) => updateField("phone", event.target.value)}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                minLength={8}
                autoComplete="new-password"
                required={!user}
                aria-invalid={Boolean(errors.password)}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user-password-confirmation">
                Konfirmasi password
              </Label>
              <Input
                id="user-password-confirmation"
                type="password"
                value={form.password_confirmation}
                minLength={8}
                autoComplete="new-password"
                required={!user}
                aria-invalid={Boolean(errors.password_confirmation)}
                onChange={(event) =>
                  updateField("password_confirmation", event.target.value)
                }
              />
              {errors.password_confirmation && (
                <p className="text-xs text-destructive">
                  {errors.password_confirmation}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-role">Role</Label>
            <Select
              value={form.role_id}
              onValueChange={(value) => {
                if (value !== null) updateField("role_id", value)
              }}
            >
              <SelectTrigger
                id="user-role"
                className="w-full"
                aria-invalid={Boolean(errors.role_id)}
              >
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Super Admin</SelectItem>
                <SelectItem value="2">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role_id && (
              <p className="text-xs text-destructive">{errors.role_id}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-partner">Partner</Label>
            <Select
              value={form.partner_id}
              onValueChange={(value) => {
                if (value !== null) updateField("partner_id", value)
              }}
            >
              <SelectTrigger id="user-partner" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PARTNER}>Tanpa partner</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={String(partner.id)}>
                    {partner.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.partner_id && (
              <p className="text-xs text-destructive">{errors.partner_id}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-status">Status</Label>
            <Select<UserStatus>
              value={form.status}
              onValueChange={(value) => {
                if (value !== null) updateField("status", value)
              }}
            >
              <SelectTrigger id="user-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
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
              {user ? "Simpan perubahan" : "Tambah user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
