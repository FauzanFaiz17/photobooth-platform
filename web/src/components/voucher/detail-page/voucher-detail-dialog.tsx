import { LoaderCircle } from "lucide-react"
import { useEffect, useState, type ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { getVoucher } from "@/features/vouchers/voucher-service"
import { voucherUsage, type VoucherRecord, type VoucherStatus } from "@/features/vouchers/voucher.types"
import { useAuth } from "@/features/auth/auth-context"
import { ApiError } from "@/lib/api-client"

const statusLabels: Record<VoucherStatus, string> = { unused: "Belum dipakai", redeemed: "Sudah dipakai", expired: "Kedaluwarsa", void: "Dibatalkan" }

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
}

function formatDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"
}

function Field({ label, children, wide }: { readonly label: string; readonly children: React.ReactNode; readonly wide?: boolean }): ReactElement {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{children}</dd>
    </div>
  )
}

export function VoucherDetailDialog({ voucher, onClose, onUnauthorized, onForbidden }: {
  readonly voucher: VoucherRecord
  readonly onClose: () => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}): ReactElement {
  const { token } = useAuth()
  const [detail, setDetail] = useState<VoucherRecord | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    getVoucher(token, voucher.id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDetail(result)
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return
        if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
        if (caught instanceof ApiError && caught.status === 403) return onForbidden()
        setError(caught instanceof ApiError ? caught.message : "Tidak dapat terhubung ke server.")
      })
    return () => controller.abort()
  }, [onForbidden, onUnauthorized, token, voucher.id])

  const item = detail ?? voucher
  const usage = voucherUsage(item)
  const pack = item.package
  const payment = item.payment

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="font-mono">{item.code}</DialogTitle>
            <Badge variant={usage.partial ? "outline" : item.status === "unused" ? "default" : item.status === "expired" || item.status === "void" ? "destructive" : "secondary"}>
              {usage.partial ? "Terpakai sebagian" : statusLabels[item.status]}
            </Badge>
            {!detail && !error && <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-label="Memuat detail" />}
          </div>
          <DialogDescription>{pack.name}</DialogDescription>
        </DialogHeader>

        {error ? (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium">Pemakaian sesi</p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {usage.used} dari {usage.limit} terpakai · {item.remaining_uses} tersisa
                </p>
              </div>
              <Progress className="mt-2" value={usage.percent} aria-label={`Pemakaian voucher ${item.code}`} />
              <p className="mt-2 text-xs text-muted-foreground">
                Rincian waktu tiap penukaran belum tersedia dari server.
              </p>
            </div>

            <Separator />

            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Harga package">{formatCurrency(pack.price)}</Field>
              <Field label="Masa berlaku">{pack.validity_days} hari</Field>
              <Field label="Orang">{pack.persons}</Field>
              <Field label="Capture">{pack.captures}</Field>
              <Field label="Cetak">{pack.print_count}</Field>
              {pack.session_count !== undefined && <Field label="Sesi per voucher">{pack.session_count}</Field>}
              <Field label="Termasuk">
                {[pack.gif_included && "GIF", pack.video_included && "Video"].filter(Boolean).join(" · ") || "Foto saja"}
              </Field>
              <Field label="Kedaluwarsa">{formatDate(item.expired_at)}</Field>
              <Field label="Diterbitkan">{formatDate(item.created_at)}</Field>
              <Field label="Ditukar terakhir">{formatDate(item.redeemed_at)}</Field>
            </dl>

            {payment && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium">Payment</p>
                  <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Field label="Reference" wide><span className="break-all font-mono text-sm">{payment.reference}</span></Field>
                    <Field label="Gateway">{payment.gateway}</Field>
                    <Field label="Status"><Badge variant={payment.status === "paid" ? "default" : payment.status === "pending" ? "secondary" : "destructive"}>{payment.status}</Badge></Field>
                    <Field label="Nominal">{formatCurrency(payment.amount)}</Field>
                    <Field label="Dibayar">{formatDate(payment.paid_at)}</Field>
                  </dl>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
