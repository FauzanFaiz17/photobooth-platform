import { CalendarDays, Search, X } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { defaultVoucherDetailFilters } from "../catalog/voucher-catalog.data"
import type {
  KioskVoucherStatus,
  KioskVoucherType,
  VoucherDetailFilters,
} from "../catalog/voucher-catalog.types"

const statusLabels: Record<KioskVoucherStatus | "all", string> = {
  all: "Semua",
  unused: "Belum Terpakai",
  used: "Sudah Terpakai",
  expired: "Kedaluwarsa",
  inactive: "Nonaktif",
}

const typeLabels: Record<KioskVoucherType | "all", string> = {
  all: "Semua",
  "free-session": "Sesi Gratis",
  discount: "Potongan Harga",
  nominal: "Nominal",
}

function isVoucherStatus(value: string): value is KioskVoucherStatus | "all" {
  return value === "all" || value === "unused" || value === "used" || value === "expired" || value === "inactive"
}

function isVoucherType(value: string): value is KioskVoucherType | "all" {
  return value === "all" || value === "free-session" || value === "discount" || value === "nominal"
}

export function VoucherDetailFilters({
  filters,
  onChange,
}: {
  readonly filters: VoucherDetailFilters
  readonly onChange: (filters: VoucherDetailFilters) => void
}): ReactElement {
  return (
    <Card className="shadow-none">
      <CardContent className="space-y-5 pt-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide opacity-60">Status Voucher</p>
          <div className="overflow-x-auto pb-1">
            <Tabs
              value={filters.status}
              onValueChange={(value) => {
                if (isVoucherStatus(value)) onChange({ ...filters, status: value })
              }}
            >
              <TabsList className="min-w-max rounded-full border p-1">
                {(Object.keys(statusLabels) as Array<KioskVoucherStatus | "all">).map((status) => (
                  <TabsTrigger key={status} value={status} className="rounded-full px-4">
                    {statusLabels[status]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide opacity-60">Tipe Voucher</p>
          <div className="overflow-x-auto pb-1">
            <Tabs
              value={filters.type}
              onValueChange={(value) => {
                if (isVoucherType(value)) onChange({ ...filters, type: value })
              }}
            >
              <TabsList className="min-w-max rounded-full border p-1">
                {(Object.keys(typeLabels) as Array<KioskVoucherType | "all">).map((type) => (
                  <TabsTrigger key={type} value={type} className="rounded-full px-4">
                    {typeLabels[type]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_minmax(12rem,0.6fr)_auto] xl:items-end">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-60"
              aria-hidden="true"
            />
            <Input
              value={filters.nameQuery}
              onChange={(event) => onChange({ ...filters, nameQuery: event.target.value })}
              className="h-11 pl-9"
              placeholder="Cari nama voucher"
              aria-label="Cari nama voucher"
            />
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-60"
              aria-hidden="true"
            />
            <Input
              value={filters.codeQuery}
              onChange={(event) => onChange({ ...filters, codeQuery: event.target.value })}
              className="h-11 pl-9"
              placeholder="Cari kode voucher"
              aria-label="Cari kode voucher"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voucher-created-date">Tanggal Dibuat</Label>
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-60"
                aria-hidden="true"
              />
              <Input
                id="voucher-created-date"
                type="date"
                value={filters.createdDate}
                onChange={(event) => onChange({ ...filters, createdDate: event.target.value })}
                className="pl-9"
              />
            </div>
          </div>
          <Button variant="ghost" onClick={() => onChange(defaultVoucherDetailFilters)}>
            <X aria-hidden="true" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
