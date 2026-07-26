import type {
  KioskVoucher,
  VoucherDetailFilters,
  VoucherFormValues,
  VoucherKioskSummary,
} from "./voucher-catalog.types"

export const voucherKioskCatalog: ReadonlyArray<VoucherKioskSummary> = [
  { id: "KSK-AMEHO", slug: "ameho", name: "AMEHO", totalVouchers: 14 },
  { id: "KSK-001", slug: "main-studio", name: "Main Studio Booth", totalVouchers: 12 },
  { id: "KSK-002", slug: "sudirman", name: "Booth Sudirman", totalVouchers: 10 },
  { id: "KSK-003", slug: "kemang", name: "Booth Kemang", totalVouchers: 9 },
  { id: "KSK-004", slug: "senayan", name: "Booth Senayan", totalVouchers: 11 },
  { id: "KSK-005", slug: "blok-m", name: "Booth Blok M", totalVouchers: 8 },
]

const voucherNames = [
  "Sesi Gratis Juli",
  "Promo Akhir Pekan",
  "Potongan Pelanggan Baru",
  "Voucher Rp25.000",
  "Member Kolase",
  "Promo Ulang Tahun",
] as const

const voucherTypes = ["free-session", "discount", "nominal"] as const
const voucherStatuses = ["unused", "unused", "used", "expired", "inactive"] as const

export const initialKioskVouchers: ReadonlyArray<KioskVoucher> = voucherKioskCatalog.flatMap(
  (kiosk, kioskIndex) =>
    Array.from({ length: kiosk.totalVouchers }, (_, voucherIndex) => {
      const type = voucherTypes[(voucherIndex + kioskIndex) % voucherTypes.length]
      const status = voucherStatuses[(voucherIndex + kioskIndex) % voucherStatuses.length]
      const usageLimit = 25 + (voucherIndex % 4) * 25
      const usedCount = status === "used" ? usageLimit : Math.min(usageLimit - 1, (voucherIndex * 7 + kioskIndex * 3) % usageLimit)
      const createdDay = 1 + (voucherIndex % 14)
      const expiresMonth = status === "expired" ? 5 : 7 + (voucherIndex % 3)

      return {
        id: `${kiosk.id}-VCR-${String(voucherIndex + 1).padStart(3, "0")}`,
        kioskId: kiosk.id,
        name: voucherNames[(voucherIndex + kioskIndex) % voucherNames.length],
        type,
        value: type === "free-session" ? 1 : type === "discount" ? 20 + (voucherIndex % 3) * 5 : 25_000 + (voucherIndex % 3) * 25_000,
        code: `${kiosk.slug.toUpperCase().replaceAll("-", "").slice(0, 6)}${String(voucherIndex + 1).padStart(3, "0")}`,
        printCount: 1 + (voucherIndex % 2),
        usageLimit,
        usedCount,
        createdAt: `2026-07-${String(createdDay).padStart(2, "0")}T10:00:00+07:00`,
        startsAt: `2026-07-${String(createdDay).padStart(2, "0")}`,
        expiresAt: `2026-${String(expiresMonth).padStart(2, "0")}-28`,
        status,
      }
    })
)

export const defaultVoucherDetailFilters: VoucherDetailFilters = {
  status: "all",
  type: "all",
  nameQuery: "",
  codeQuery: "",
  createdDate: "",
}

export function createVoucherFormDefaults(kioskId: string): VoucherFormValues {
  return {
    name: "",
    type: "free-session",
    value: "1",
    code: "KOLASE",
    kioskId,
    quantity: "1",
    printCount: "1",
    usageLimit: "1",
    startDate: "2026-07-18",
    expirationDate: "2026-08-18",
    active: true,
  }
}

export function findVoucherKiosk(kioskId: string | undefined): VoucherKioskSummary | undefined {
  if (!kioskId) return undefined
  return voucherKioskCatalog.find((kiosk) => kiosk.slug === kioskId || kiosk.id === kioskId)
}

export function getVouchersForKiosk(
  vouchers: ReadonlyArray<KioskVoucher>,
  kioskId: string
): ReadonlyArray<KioskVoucher> {
  return vouchers.filter((voucher) => voucher.kioskId === kioskId)
}
