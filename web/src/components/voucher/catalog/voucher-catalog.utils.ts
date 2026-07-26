import type {
  KioskVoucher,
  KioskVoucherType,
  VoucherDetailFilters,
  VoucherFormErrors,
  VoucherFormValues,
} from "./voucher-catalog.types"

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export const voucherTypeLabels: Record<KioskVoucherType, string> = {
  "free-session": "Sesi Gratis",
  discount: "Potongan Harga",
  nominal: "Nominal",
}

export function formatVoucherDate(value: string): string {
  return dateFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00+07:00`))
}

export function formatVoucherValue(voucher: Pick<KioskVoucher, "type" | "value">): string {
  if (voucher.type === "free-session") return `${voucher.value} sesi`
  if (voucher.type === "discount") return `${voucher.value}%`
  return `Rp ${voucher.value.toLocaleString("id-ID")}`
}

export function filterKioskVouchers(
  vouchers: ReadonlyArray<KioskVoucher>,
  filters: VoucherDetailFilters
): ReadonlyArray<KioskVoucher> {
  const nameQuery = filters.nameQuery.trim().toLocaleLowerCase("id-ID")
  const codeQuery = filters.codeQuery.trim().toLocaleLowerCase("id-ID")
  return vouchers.filter((voucher) => {
    if (filters.status !== "all" && voucher.status !== filters.status) return false
    if (filters.type !== "all" && voucher.type !== filters.type) return false
    if (nameQuery && !voucher.name.toLocaleLowerCase("id-ID").includes(nameQuery)) return false
    if (codeQuery && !voucher.code.toLocaleLowerCase("id-ID").includes(codeQuery)) return false
    if (filters.createdDate && voucher.createdAt.slice(0, 10) !== filters.createdDate) return false
    return true
  })
}

export function validateVoucherForm(values: VoucherFormValues): VoucherFormErrors {
  const errors: VoucherFormErrors = {}
  const quantity = Number(values.quantity)
  const printCount = Number(values.printCount)
  const usageLimit = Number(values.usageLimit)
  const value = Number(values.value)

  if (values.name.trim().length < 3) errors.name = "Nama voucher minimal 3 karakter."
  if (!/^[A-Z0-9-]{4,24}$/.test(values.code.trim().toUpperCase())) {
    errors.code = "Kode harus 4–24 karakter berupa huruf, angka, atau tanda hubung."
  }
  if (!Number.isFinite(value) || value <= 0) errors.value = "Nilai voucher harus lebih dari 0."
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) errors.quantity = "Jumlah voucher harus 1–100."
  if (!Number.isInteger(printCount) || printCount < 1 || printCount > 10) errors.printCount = "Jumlah cetak harus 1–10."
  if (!Number.isInteger(usageLimit) || usageLimit < 1) errors.usageLimit = "Batas penggunaan minimal 1."
  if (!values.kioskId) errors.kioskId = "Pilih kiosk tempat voucher berlaku."
  if (!values.startDate) errors.startDate = "Tanggal mulai wajib diisi."
  if (!values.expirationDate) errors.expirationDate = "Tanggal kedaluwarsa wajib diisi."
  if (values.startDate && values.expirationDate && values.expirationDate <= values.startDate) {
    errors.expirationDate = "Tanggal kedaluwarsa harus setelah tanggal mulai."
  }

  return errors
}
