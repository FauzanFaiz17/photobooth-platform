import { Search, X } from "lucide-react"
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
import { defaultPhotoboothTransactionFilters } from "./transaction-operations.data"
import type {
  PhotoboothKioskOption,
  PhotoboothPaymentMethod,
  PhotoboothSessionMode,
  PhotoboothTransactionFilters,
  PhotoboothTransactionStatus,
} from "./transaction-operations.types"
import { paymentMethodLabels, sessionModeLabels } from "./transaction-operations.utils"

const statusLabels: Record<PhotoboothTransactionStatus, string> = {
  success: "Berhasil",
  pending: "Pending",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  voucher: "Voucher",
  free: "Gratis",
}

function isStatus(value: string): value is PhotoboothTransactionStatus | "all" {
  return value === "all" || value in statusLabels
}

function isSessionMode(value: string): value is PhotoboothSessionMode | "all" {
  return value === "all" || value in sessionModeLabels
}

function isPaymentMethod(value: string): value is PhotoboothPaymentMethod | "all" {
  return value === "all" || value in paymentMethodLabels
}

interface TransactionOperationsFiltersProps {
  readonly filters: PhotoboothTransactionFilters
  readonly kiosks: ReadonlyArray<PhotoboothKioskOption>
  readonly onChange: (filters: PhotoboothTransactionFilters) => void
}

export function TransactionOperationsFilters({
  filters,
  kiosks,
  onChange,
}: TransactionOperationsFiltersProps): ReactElement {
  return (
    <Card className="shadow-none">
      <CardContent className="space-y-4 pt-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-60"
            aria-hidden="true"
          />
          <Input
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            className="h-11 pl-9"
            placeholder="Cari ID transaksi atau nama kiosk"
            aria-label="Cari ID transaksi atau nama kiosk"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="transaction-date-from">Dari tanggal</Label>
            <Input
              id="transaction-date-from"
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo}
              onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transaction-date-to">Sampai tanggal</Label>
            <Input
              id="transaction-date-to"
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom}
              onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transaction-kiosk">Kiosk / Booth</Label>
            <Select<string>
              value={filters.kioskId}
              onValueChange={(value) => value && onChange({ ...filters, kioskId: value })}
            >
              <SelectTrigger id="transaction-kiosk" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kiosk</SelectItem>
                {kiosks.map((kiosk) => (
                  <SelectItem key={kiosk.id} value={kiosk.id}>{kiosk.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transaction-status">Status Transaksi</Label>
            <Select<PhotoboothTransactionStatus | "all">
              value={filters.status}
              onValueChange={(value) => {
                if (value && isStatus(value)) onChange({ ...filters, status: value })
              }}
            >
              <SelectTrigger id="transaction-status" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {(Object.keys(statusLabels) as PhotoboothTransactionStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transaction-mode">Mode Sesi</Label>
            <Select<PhotoboothSessionMode | "all">
              value={filters.sessionMode}
              onValueChange={(value) => {
                if (value && isSessionMode(value)) onChange({ ...filters, sessionMode: value })
              }}
            >
              <SelectTrigger id="transaction-mode" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua mode</SelectItem>
                {(Object.keys(sessionModeLabels) as PhotoboothSessionMode[]).map((mode) => (
                  <SelectItem key={mode} value={mode}>{sessionModeLabels[mode]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full space-y-2 sm:max-w-xs">
            <Label htmlFor="transaction-payment-method">Metode Pembayaran</Label>
            <Select<PhotoboothPaymentMethod | "all">
              value={filters.paymentMethod}
              onValueChange={(value) => {
                if (value && isPaymentMethod(value)) onChange({ ...filters, paymentMethod: value })
              }}
            >
              <SelectTrigger id="transaction-payment-method" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua metode</SelectItem>
                {(Object.keys(paymentMethodLabels) as PhotoboothPaymentMethod[])
                  .filter((method) => method !== "none")
                  .map((method) => (
                    <SelectItem key={method} value={method}>{paymentMethodLabels[method]}</SelectItem>
                  ))}
                <SelectItem value="none">Tanpa pembayaran</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" onClick={() => onChange(defaultPhotoboothTransactionFilters)}>
            <X aria-hidden="true" />
            Reset Filter
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
