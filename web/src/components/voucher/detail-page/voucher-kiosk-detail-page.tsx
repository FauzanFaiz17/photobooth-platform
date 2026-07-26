import { ArrowLeft, Download, Plus } from "lucide-react"
import { useMemo, useState, type ReactElement } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Toaster } from "@/components/ui/sonner"
import {
  createVoucherFormDefaults,
  defaultVoucherDetailFilters,
  findVoucherKiosk,
  getVouchersForKiosk,
  initialKioskVouchers,
  voucherKioskCatalog,
} from "../catalog/voucher-catalog.data"
import type {
  KioskVoucher,
  VoucherDetailFilters as VoucherFilters,
  VoucherFormValues,
} from "../catalog/voucher-catalog.types"
import {
  filterKioskVouchers,
  formatVoucherValue,
  voucherTypeLabels,
} from "../catalog/voucher-catalog.utils"
import { VoucherDeleteDialog } from "./voucher-delete-dialog"
import { VoucherDetailDialog } from "./voucher-detail-dialog"
import { VoucherDetailFilters } from "./voucher-detail-filters"
import { VoucherDetailPagination } from "./voucher-detail-pagination"
import {
  VoucherDetailEmptyState,
  VoucherDetailLoadingState,
} from "./voucher-detail-states"
import { VoucherDetailTable } from "./voucher-detail-table"
import { VoucherFormDialog } from "./voucher-form-dialog"

const pageSize = 10

function exportVoucherData(vouchers: ReadonlyArray<KioskVoucher>, kioskName: string): void {
  const rows = [
    ["ID", "Nama", "Tipe", "Nilai", "Kode", "Jumlah Cetak", "Batas Penggunaan", "Sudah Digunakan", "Tanggal Dibuat", "Tanggal Kedaluwarsa", "Status"],
    ...vouchers.map((voucher) => [
      voucher.id,
      voucher.name,
      voucherTypeLabels[voucher.type],
      formatVoucherValue(voucher),
      voucher.code,
      String(voucher.printCount),
      String(voucher.usageLimit),
      String(voucher.usedCount),
      voucher.createdAt,
      voucher.expiresAt,
      voucher.status,
    ]),
  ]
  const csv = rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n")
  const file = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(file)
  const link = document.createElement("a")
  link.href = url
  link.download = `voucher-${kioskName.toLocaleLowerCase("id-ID").replaceAll(" ", "-")}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formValuesFromVoucher(voucher: KioskVoucher): VoucherFormValues {
  return {
    name: voucher.name,
    type: voucher.type,
    value: String(voucher.value),
    code: voucher.code,
    kioskId: voucher.kioskId,
    quantity: "1",
    printCount: String(voucher.printCount),
    usageLimit: String(voucher.usageLimit),
    startDate: voucher.startsAt,
    expirationDate: voucher.expiresAt,
    active: voucher.status !== "inactive",
  }
}

export function VoucherKioskDetailPage(): ReactElement {
  const { kioskId } = useParams<{ kioskId: string }>()
  const kiosk = findVoucherKiosk(kioskId)
  const fallbackKioskId = kiosk?.id ?? voucherKioskCatalog[0].id
  const [vouchers, setVouchers] = useState<ReadonlyArray<KioskVoucher>>(initialKioskVouchers)
  const [filters, setFilters] = useState<VoucherFilters>(defaultVoucherDetailFilters)
  const [page, setPage] = useState(1)
  const [detailVoucher, setDetailVoucher] = useState<KioskVoucher | null>(null)
  const [deleteVoucher, setDeleteVoucher] = useState<KioskVoucher | null>(null)
  const [editVoucherId, setEditVoucherId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<"generate" | "edit">("generate")
  const [formOpen, setFormOpen] = useState(false)
  const [formInitialValues, setFormInitialValues] = useState<VoucherFormValues>(
    () => createVoucherFormDefaults(fallbackKioskId)
  )
  const isLoading = false

  const kioskVouchers = useMemo(
    () => kiosk ? getVouchersForKiosk(vouchers, kiosk.id) : [],
    [kiosk, vouchers]
  )
  const filteredVouchers = useMemo(
    () => filterKioskVouchers(kioskVouchers, filters),
    [filters, kioskVouchers]
  )
  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleVouchers = filteredVouchers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (isLoading) return <VoucherDetailLoadingState />

  if (!kiosk) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="mx-auto max-w-lg shadow-none">
          <CardHeader><CardTitle><h1>Kiosk tidak ditemukan</h1></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm opacity-70">Data voucher kiosk yang Anda cari tidak tersedia.</p>
            <Button render={<Link to="/voucher" />}>
              <ArrowLeft aria-hidden="true" />
              Kembali ke Daftar Voucher
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  function openGenerateDialog(): void {
    setFormMode("generate")
    setEditVoucherId(null)
    setFormInitialValues(createVoucherFormDefaults(fallbackKioskId))
    setFormOpen(true)
  }

  function openEditDialog(voucher: KioskVoucher): void {
    setFormMode("edit")
    setEditVoucherId(voucher.id)
    setFormInitialValues(formValuesFromVoucher(voucher))
    setFormOpen(true)
  }

  function handleFormSubmit(values: VoucherFormValues): void {
    if (formMode === "edit" && editVoucherId) {
      setVouchers((current) => current.map((voucher) => {
        if (voucher.id !== editVoucherId) return voucher
        return {
          ...voucher,
          kioskId: values.kioskId,
          name: values.name.trim(),
          type: values.type,
          value: Number(values.value),
          code: values.code,
          printCount: Number(values.printCount),
          usageLimit: Number(values.usageLimit),
          startsAt: values.startDate,
          expiresAt: values.expirationDate,
          status: values.active
            ? voucher.status === "inactive" ? "unused" : voucher.status
            : "inactive",
        }
      }))
      toast.success("Voucher berhasil diperbarui")
    } else {
      const quantity = Number(values.quantity)
      const generated = Array.from({ length: quantity }, (_, index): KioskVoucher => ({
        id: `VCR-GEN-${String(vouchers.length + index + 1).padStart(4, "0")}`,
        kioskId: values.kioskId,
        name: values.name.trim(),
        type: values.type,
        value: Number(values.value),
        code: quantity === 1 ? values.code : `${values.code}-${String(index + 1).padStart(3, "0")}`,
        printCount: Number(values.printCount),
        usageLimit: Number(values.usageLimit),
        usedCount: 0,
        createdAt: "2026-07-18T12:00:00+07:00",
        startsAt: values.startDate,
        expiresAt: values.expirationDate,
        status: values.active ? "unused" : "inactive",
      }))
      setVouchers((current) => [...generated, ...current])
      toast.success(`${generated.length} voucher berhasil dibuat`)
    }
    setFormOpen(false)
  }

  function handleDelete(): void {
    if (!deleteVoucher) return
    setVouchers((current) => current.filter((voucher) => voucher.id !== deleteVoucher.id))
    toast.success("Voucher berhasil dihapus")
    setDeleteVoucher(null)
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-5">
        <Button variant="ghost" render={<Link to="/voucher" />}>
          <ArrowLeft aria-hidden="true" />
          Daftar Voucher
        </Button>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Daftar Voucher {kiosk.name}</h1>
            <p className="mt-2 text-sm opacity-70">{kioskVouchers.length} voucher tersedia untuk kiosk ini.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => exportVoucherData(filteredVouchers, kiosk.name)}>
              <Download aria-hidden="true" />
              Export
            </Button>
            <Button onClick={openGenerateDialog}>
              <Plus aria-hidden="true" />
              Generate Voucher
            </Button>
          </div>
        </div>
      </header>

      <VoucherDetailFilters
        filters={filters}
        onChange={(nextFilters) => {
          setFilters(nextFilters)
          setPage(1)
        }}
      />

      {visibleVouchers.length > 0 ? (
        <Card className="min-w-0 shadow-none">
          <CardContent className="space-y-4 px-0">
            <VoucherDetailTable
              vouchers={visibleVouchers}
              onView={setDetailVoucher}
              onEdit={openEditDialog}
              onDisable={(voucher) => {
                setVouchers((current) => current.map((item) =>
                  item.id === voucher.id ? { ...item, status: "inactive" } : item
                ))
                toast.success(`${voucher.code} dinonaktifkan`)
              }}
              onDelete={setDeleteVoucher}
            />
            <div className="px-4">
              <VoucherDetailPagination
                page={currentPage}
                totalPages={totalPages}
                totalItems={filteredVouchers.length}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <VoucherDetailEmptyState
          onReset={() => {
            setFilters(defaultVoucherDetailFilters)
            setPage(1)
          }}
        />
      )}

      <VoucherDetailDialog
        voucher={detailVoucher}
        open={detailVoucher !== null}
        onOpenChange={(open) => {
          if (!open) setDetailVoucher(null)
        }}
      />
      {formOpen && (
        <VoucherFormDialog
          open
          mode={formMode}
          initialValues={formInitialValues}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
        />
      )}
      <VoucherDeleteDialog
        voucher={deleteVoucher}
        open={deleteVoucher !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteVoucher(null)
        }}
        onConfirm={handleDelete}
      />
      <Toaster position="top-right" />
    </div>
  )
}
