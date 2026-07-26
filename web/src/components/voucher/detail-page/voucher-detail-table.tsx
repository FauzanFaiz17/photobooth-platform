import { Ban, Ellipsis, Eye, Pencil, Trash2 } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { KioskVoucher } from "../catalog/voucher-catalog.types"
import {
  formatVoucherDate,
  formatVoucherValue,
} from "../catalog/voucher-catalog.utils"
import { VoucherStatusBadge, VoucherTypeBadge } from "./voucher-detail-badges"

interface VoucherDetailTableProps {
  readonly vouchers: ReadonlyArray<KioskVoucher>
  readonly onView: (voucher: KioskVoucher) => void
  readonly onEdit: (voucher: KioskVoucher) => void
  readonly onDisable: (voucher: KioskVoucher) => void
  readonly onDelete: (voucher: KioskVoucher) => void
}

export function VoucherDetailTable({
  vouchers,
  onView,
  onEdit,
  onDisable,
  onDelete,
}: VoucherDetailTableProps): ReactElement {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Nama Voucher</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead>Nilai</TableHead>
          <TableHead>Kode</TableHead>
          <TableHead className="text-right">Jumlah Cetak</TableHead>
          <TableHead className="text-right">Batas Penggunaan</TableHead>
          <TableHead className="text-right">Sudah Digunakan</TableHead>
          <TableHead>Tanggal Dibuat</TableHead>
          <TableHead>Tanggal Kedaluwarsa</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vouchers.map((voucher) => (
          <TableRow key={voucher.id}>
            <TableCell className="font-mono text-xs">{voucher.id}</TableCell>
            <TableCell className="font-medium">{voucher.name}</TableCell>
            <TableCell><VoucherTypeBadge type={voucher.type} /></TableCell>
            <TableCell className="tabular-nums">{formatVoucherValue(voucher)}</TableCell>
            <TableCell className="font-mono text-xs">{voucher.code}</TableCell>
            <TableCell className="text-right tabular-nums">{voucher.printCount}</TableCell>
            <TableCell className="text-right tabular-nums">{voucher.usageLimit}</TableCell>
            <TableCell className="text-right tabular-nums">{voucher.usedCount}</TableCell>
            <TableCell>{formatVoucherDate(voucher.createdAt)}</TableCell>
            <TableCell>{formatVoucherDate(voucher.expiresAt)}</TableCell>
            <TableCell><VoucherStatusBadge status={voucher.status} /></TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon-sm" aria-label={`Aksi ${voucher.code}`} />}
                >
                  <Ellipsis aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(voucher)}>
                    <Eye aria-hidden="true" />
                    Lihat Detail
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(voucher)}>
                    <Pencil aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={voucher.status === "inactive"}
                    onClick={() => onDisable(voucher)}
                  >
                    <Ban aria-hidden="true" />
                    Nonaktifkan
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(voucher)}>
                    <Trash2 aria-hidden="true" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
