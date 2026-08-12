import { LoaderCircle } from "lucide-react"
import { useEffect, useState, type ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/features/auth/auth-context"
import { getPayment } from "@/features/payments/payment-service"
import type { PaymentGateway, PaymentRecord, PaymentStatus } from "@/features/payments/payment.types"
import { ApiError } from "@/lib/api-client"

const gatewayLabels: Record<PaymentGateway, string> = { midtrans_qris: "QRIS Midtrans", voucher: "Voucher", cash: "Tunai", other: "Lainnya" }
const statusLabels: Record<PaymentStatus, string> = { pending: "Pending", paid: "Dibayar", failed: "Gagal", expired: "Kedaluwarsa", refunded: "Dikembalikan" }
function currency(value: number): string { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value) }
function date(value: string | null): string { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—" }
function Row({ label, value }: { readonly label: string; readonly value: string }): ReactElement { return <div className="flex items-start justify-between gap-4 py-1.5"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-72 break-all text-right font-medium">{value}</dd></div> }

export function PaymentDetailDialog({ payment, open, onOpenChange, onUnauthorized, onForbidden }: { readonly payment: PaymentRecord; readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onUnauthorized: () => void; readonly onForbidden: () => void }): ReactElement {
  const { token } = useAuth(); const [record, setRecord] = useState(payment); const [loading, setLoading] = useState(true); const [error, setError] = useState("")
  useEffect(() => { if (!token || !open) return; let active = true; void getPayment(token, payment.id).then((result) => { if (active) setRecord(result) }).catch((caught: unknown) => { if (!active) return; if (caught instanceof ApiError && caught.status === 401) return onUnauthorized(); if (caught instanceof ApiError && caught.status === 403) return onForbidden(); setError(caught instanceof ApiError ? caught.message : "Detail Payment gagal dimuat.") }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [onForbidden, onUnauthorized, open, payment.id, token])
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Detail Payment</DialogTitle><DialogDescription>{record.reference}</DialogDescription></DialogHeader>{loading ? <div className="grid min-h-40 place-items-center"><LoaderCircle className="animate-spin" /></div> : error ? <p className="text-sm text-destructive">{error}</p> : <div className="space-y-4"><div className="flex items-center justify-between"><span className="font-mono text-xs">#{record.id}</span><Badge>{statusLabels[record.status]}</Badge></div><Separator /><dl><Row label="Partner ID" value={String(record.partner_id)} /><Row label="Gateway" value={gatewayLabels[record.gateway]} /><Row label="Nominal" value={currency(record.amount)} /><Row label="Fee" value={currency(record.fee)} /><Row label="Net amount" value={currency(record.net_amount)} /><Row label="Voucher ID" value={record.voucher_id ? String(record.voucher_id) : "—"} /><Row label="Kedaluwarsa" value={date(record.expired_at)} /><Row label="Dibayar" value={date(record.paid_at)} /><Row label="Dibuat" value={date(record.created_at)} /><Row label="Diperbarui" value={date(record.updated_at)} /></dl>{record.gateway_response !== null && <><Separator /><section><h3 className="font-medium">Gateway response</h3><pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(record.gateway_response, null, 2)}</pre></section></>}</div>}</DialogContent></Dialog>
}
