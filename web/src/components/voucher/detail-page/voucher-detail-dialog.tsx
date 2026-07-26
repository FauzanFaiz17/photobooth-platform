import type { ReactElement } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { KioskVoucher } from "../catalog/voucher-catalog.types"
import {
  formatVoucherDate,
  formatVoucherValue,
  voucherTypeLabels,
} from "../catalog/voucher-catalog.utils"
import { VoucherStatusBadge } from "./voucher-detail-badges"

function DetailRow({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="opacity-60">{label}</dt>
      <dd className="max-w-72 text-right font-medium">{value}</dd>
    </div>
  )
}

export function VoucherDetailDialog({
  voucher,
  open,
  onOpenChange,
}: {
  readonly voucher: KioskVoucher | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detail Voucher</DialogTitle>
          <DialogDescription>
            {voucher ? `${voucher.name} · ${voucher.code}` : "Pilih voucher untuk melihat detail."}
          </DialogDescription>
        </DialogHeader>
        {voucher && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-sm">{voucher.id}</p>
              <VoucherStatusBadge status={voucher.status} />
            </div>
            <Separator />
            <dl>
              <DetailRow label="Nama voucher" value={voucher.name} />
              <DetailRow label="Tipe" value={voucherTypeLabels[voucher.type]} />
              <DetailRow label="Nilai" value={formatVoucherValue(voucher)} />
              <DetailRow label="Kode" value={voucher.code} />
              <DetailRow label="Jumlah cetak" value={String(voucher.printCount)} />
              <DetailRow label="Batas penggunaan" value={String(voucher.usageLimit)} />
              <DetailRow label="Sudah digunakan" value={String(voucher.usedCount)} />
              <DetailRow label="Tanggal mulai" value={formatVoucherDate(voucher.startsAt)} />
              <DetailRow label="Tanggal dibuat" value={formatVoucherDate(voucher.createdAt)} />
              <DetailRow label="Tanggal kedaluwarsa" value={formatVoucherDate(voucher.expiresAt)} />
            </dl>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
