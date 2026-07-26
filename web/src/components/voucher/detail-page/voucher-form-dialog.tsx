import { RefreshCw } from "lucide-react"
import { useState, type ReactElement } from "react"

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
import { voucherKioskCatalog } from "../catalog/voucher-catalog.data"
import type {
  KioskVoucherType,
  VoucherFormErrors,
  VoucherFormValues,
} from "../catalog/voucher-catalog.types"
import {
  validateVoucherForm,
  voucherTypeLabels,
} from "../catalog/voucher-catalog.utils"

interface VoucherFormDialogProps {
  readonly open: boolean
  readonly mode: "generate" | "edit"
  readonly initialValues: VoucherFormValues
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (values: VoucherFormValues) => void
}

function isVoucherType(value: string): value is KioskVoucherType {
  return value === "free-session" || value === "discount" || value === "nominal"
}

function FieldError({ message }: { readonly message?: string }): ReactElement | null {
  if (!message) return null
  return <p className="text-xs opacity-70" role="alert">{message}</p>
}

function createAutomaticCode(): string {
  return `KOLASE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export function VoucherFormDialog({
  open,
  mode,
  initialValues,
  onOpenChange,
  onSubmit,
}: VoucherFormDialogProps): ReactElement {
  const [values, setValues] = useState<VoucherFormValues>(initialValues)
  const [errors, setErrors] = useState<VoucherFormErrors>({})

  function update<K extends keyof VoucherFormValues>(
    key: K,
    value: VoucherFormValues[K]
  ): void {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function handleSubmit(): void {
    const nextErrors = validateVoucherForm(values)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    onSubmit({ ...values, code: values.code.trim().toUpperCase() })
  }

  const valueLabel = values.type === "discount"
    ? "Nilai diskon (%)"
    : values.type === "nominal"
      ? "Nilai nominal (IDR)"
      : "Jumlah sesi gratis"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "generate" ? "Generate Voucher" : "Edit Voucher"}</DialogTitle>
          <DialogDescription>
            {mode === "generate"
              ? "Buat voucher baru untuk operasional kiosk Kolase Photobooth."
              : "Perbarui konfigurasi voucher yang dipilih."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="voucher-form-name">Nama voucher</Label>
            <Input
              id="voucher-form-name"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Promo Ulang Tahun"
              aria-invalid={Boolean(errors.name)}
            />
            <FieldError message={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voucher-form-type">Tipe voucher</Label>
            <Select<KioskVoucherType>
              value={values.type}
              onValueChange={(value) => {
                if (value && isVoucherType(value)) update("type", value)
              }}
            >
              <SelectTrigger id="voucher-form-type" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(voucherTypeLabels) as KioskVoucherType[]).map((type) => (
                  <SelectItem key={type} value={type}>{voucherTypeLabels[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voucher-form-value">{valueLabel}</Label>
            <Input
              id="voucher-form-value"
              type="number"
              min={1}
              value={values.value}
              onChange={(event) => update("value", event.target.value)}
              aria-invalid={Boolean(errors.value)}
            />
            <FieldError message={errors.value} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="voucher-form-code">Kode voucher</Label>
            <div className="flex gap-2">
              <Input
                id="voucher-form-code"
                value={values.code}
                onChange={(event) => update("code", event.target.value.toUpperCase())}
                aria-invalid={Boolean(errors.code)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => update("code", createAutomaticCode())}
              >
                <RefreshCw aria-hidden="true" />
                Generate Otomatis
              </Button>
            </div>
            <FieldError message={errors.code} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="voucher-form-kiosk">Kiosk tempat voucher berlaku</Label>
            <Select<string>
              value={values.kioskId}
              onValueChange={(value) => value && update("kioskId", value)}
            >
              <SelectTrigger id="voucher-form-kiosk" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {voucherKioskCatalog.map((kiosk) => (
                  <SelectItem key={kiosk.id} value={kiosk.id}>{kiosk.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.kioskId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voucher-form-quantity">Jumlah voucher yang dibuat</Label>
            <Input
              id="voucher-form-quantity"
              type="number"
              min={1}
              max={100}
              disabled={mode === "edit"}
              value={values.quantity}
              onChange={(event) => update("quantity", event.target.value)}
              aria-invalid={Boolean(errors.quantity)}
            />
            <FieldError message={errors.quantity} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voucher-form-print">Jumlah cetak per sesi</Label>
            <Input
              id="voucher-form-print"
              type="number"
              min={1}
              max={10}
              value={values.printCount}
              onChange={(event) => update("printCount", event.target.value)}
              aria-invalid={Boolean(errors.printCount)}
            />
            <FieldError message={errors.printCount} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="voucher-form-limit">Batas maksimal penggunaan</Label>
            <Input
              id="voucher-form-limit"
              type="number"
              min={1}
              value={values.usageLimit}
              onChange={(event) => update("usageLimit", event.target.value)}
              aria-invalid={Boolean(errors.usageLimit)}
            />
            <FieldError message={errors.usageLimit} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voucher-form-start">Tanggal mulai</Label>
            <Input
              id="voucher-form-start"
              type="date"
              value={values.startDate}
              onChange={(event) => update("startDate", event.target.value)}
              aria-invalid={Boolean(errors.startDate)}
            />
            <FieldError message={errors.startDate} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voucher-form-expiration">Tanggal kedaluwarsa</Label>
            <Input
              id="voucher-form-expiration"
              type="date"
              min={values.startDate}
              value={values.expirationDate}
              onChange={(event) => update("expirationDate", event.target.value)}
              aria-invalid={Boolean(errors.expirationDate)}
            />
            <FieldError message={errors.expirationDate} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4 sm:col-span-2">
            <div>
              <Label htmlFor="voucher-form-active">Status aktif</Label>
              <p className="mt-1 text-xs opacity-60">Voucher dapat digunakan setelah tanggal mulai.</p>
            </div>
            <Switch
              id="voucher-form-active"
              checked={values.active}
              onCheckedChange={(checked) => update("active", checked)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit}>
            {mode === "generate" ? "Generate Voucher" : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
