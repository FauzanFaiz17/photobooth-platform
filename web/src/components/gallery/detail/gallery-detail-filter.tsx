import { RotateCcw } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { defaultGalleryDetailFilters } from "../catalog/gallery-catalog-data"
import type {
  GalleryApprovalStatus,
  GalleryDetailFilters,
} from "../catalog/gallery-catalog.types"

interface GalleryDetailFilterProps {
  readonly filters: GalleryDetailFilters
  readonly onChange: (filters: GalleryDetailFilters) => void
}

function isApprovalFilter(
  value: string
): value is GalleryApprovalStatus | "all" {
  return value === "all" || value === "approved" || value === "pending" || value === "rejected"
}

export function GalleryDetailFilter({
  filters,
  onChange,
}: GalleryDetailFilterProps): ReactElement {
  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto_auto] xl:items-end">
        <div className="space-y-2">
          <Label htmlFor="gallery-detail-date-from">Dari tanggal</Label>
          <Input
            id="gallery-detail-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gallery-detail-date-to">Sampai tanggal</Label>
          <Input
            id="gallery-detail-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gallery-approval">Status persetujuan</Label>
          <Select<GalleryApprovalStatus | "all">
            value={filters.approvalStatus}
            onValueChange={(value) => {
              if (value && isApprovalFilter(value)) {
                onChange({ ...filters, approvalStatus: value })
              }
            }}
          >
            <SelectTrigger id="gallery-approval" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex h-8 items-center justify-between gap-3 rounded-lg border px-3 sm:col-span-2 xl:col-span-1">
          <Label htmlFor="gallery-voucher-only" className="whitespace-nowrap">Dengan voucher</Label>
          <Switch
            id="gallery-voucher-only"
            checked={filters.voucherOnly}
            onCheckedChange={(checked) => onChange({ ...filters, voucherOnly: checked })}
          />
        </div>
        <Button
          variant="ghost"
          onClick={() => onChange(defaultGalleryDetailFilters)}
        >
          <RotateCcw aria-hidden="true" />
          Reset
        </Button>
      </CardContent>
    </Card>
  )
}
