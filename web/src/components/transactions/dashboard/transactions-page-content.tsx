import { ChevronLeft, ChevronRight, Download, Ellipsis, Eye, RefreshCw, Search, WalletCards } from "lucide-react"
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactElement } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { PaymentDetailDialog } from "@/components/transactions/detail/payment-detail-dialog"
import { PaymentTransitionDialog } from "@/components/transactions/dialogs/payment-transition-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isSuperAdmin } from "@/features/auth/auth-access"
import { useAuth } from "@/features/auth/auth-context"
import { getPartners } from "@/features/partners/partner-service"
import type { PartnerRecord } from "@/features/partners/partner.types"
import { getPayments } from "@/features/payments/payment-service"
import { PAYMENT_GATEWAYS, PAYMENT_STATUSES, isPaymentGateway, isPaymentStatus, type PaymentGateway, type PaymentListResponse, type PaymentRecord, type PaymentStatus } from "@/features/payments/payment.types"
import { ApiError } from "@/lib/api-client"

const gatewayLabels: Record<PaymentGateway, string> = { midtrans_qris: "QRIS Midtrans", voucher: "Voucher", cash: "Tunai", other: "Lainnya" }
const statusLabels: Record<PaymentStatus, string> = { pending: "Pending", paid: "Dibayar", failed: "Gagal", expired: "Kedaluwarsa", refunded: "Dikembalikan" }
const statusVariants: Record<PaymentStatus, "default" | "secondary" | "destructive" | "outline"> = { pending: "secondary", paid: "default", failed: "destructive", expired: "outline", refunded: "secondary" }

function positiveInteger(value: string | null, fallback: number): number { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback }
function formatCurrency(value: number): string { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value) }
function formatDate(value: string): string { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) }

function exportPayments(payments: ReadonlyArray<PaymentRecord>): void {
  const rows = [["Reference", "Gateway", "Status", "Amount", "Fee", "Net Amount", "Paid At", "Created At"], ...payments.map((payment) => [payment.reference, gatewayLabels[payment.gateway], statusLabels[payment.status], String(payment.amount), String(payment.fee), String(payment.net_amount), payment.paid_at ?? "", payment.created_at])]
  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "payments-kolase.csv"; document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url)
}

export function TransactionsPageContent(): ReactElement {
  const navigate = useNavigate(); const [params, setParams] = useSearchParams(); const { token, user, logout } = useAuth(); const superAdmin = isSuperAdmin(user)
  const page = positiveInteger(params.get("page"), 1); const perPage = positiveInteger(params.get("per_page"), 10); const search = params.get("search") ?? ""; const gatewayParam = params.get("gateway"); const gateway = isPaymentGateway(gatewayParam) ? gatewayParam : undefined; const statusParam = params.get("status"); const status = isPaymentStatus(statusParam) ? statusParam : undefined; const partnerId = positiveInteger(params.get("partner_id"), 0)
  const [response, setResponse] = useState<PaymentListResponse | null>(null); const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]); const [state, setState] = useState<"loading" | "success" | "error">("loading"); const [error, setError] = useState(""); const [retry, setRetry] = useState(0); const [detail, setDetail] = useState<PaymentRecord | null>(null); const [transitioning, setTransitioning] = useState<PaymentRecord | null>(null)
  const updateParams = useCallback((updates: Readonly<Record<string, string | null>>) => { setParams((current) => { const next = new URLSearchParams(current); for (const [key, value] of Object.entries(updates)) { if (value) next.set(key, value); else next.delete(key) } return next }, { replace: true }) }, [setParams])
  const unauthorized = useCallback(async () => { await logout(); navigate("/login", { replace: true }) }, [logout, navigate]); const forbidden = useCallback(() => navigate("/admin/forbidden", { replace: true, state: { from: "/transactions" } }), [navigate])

  useEffect(() => {
    if (!token) return
    const accessToken = token; const controller = new AbortController()
    async function load(): Promise<void> {
      setState("loading"); setError("")
      try {
        const [paymentsResult, partnersResult] = await Promise.all([
          getPayments(accessToken, { partner_id: partnerId || undefined, gateway, status, search: search || undefined, sort: "created_at", direction: "desc", per_page: perPage, page }, controller.signal),
          superAdmin ? getPartners(accessToken, { per_page: 100 }, controller.signal) : Promise.resolve(null),
        ])
        if (controller.signal.aborted) return
        if (page > Math.max(1, paymentsResult.meta.last_page)) { updateParams({ page: paymentsResult.meta.last_page > 1 ? String(paymentsResult.meta.last_page) : null }); return }
        setResponse(paymentsResult); setPartners(partnersResult?.data ?? []); setState("success")
      } catch (caught: unknown) {
        if (controller.signal.aborted) return
        if (caught instanceof ApiError && caught.status === 401) return void unauthorized()
        if (caught instanceof ApiError && caught.status === 403) return forbidden()
        setResponse(null); setError(caught instanceof ApiError ? caught.message : "Tidak dapat terhubung ke server."); setState("error")
      }
    }
    void load(); return () => controller.abort()
  }, [forbidden, gateway, page, partnerId, perPage, retry, search, status, superAdmin, token, unauthorized, updateParams])

  const summary = useMemo(() => { const data = response?.data ?? []; return { net: data.filter((item) => item.status === "paid").reduce((total, item) => total + item.net_amount, 0), paid: data.filter((item) => item.status === "paid").length, pending: data.filter((item) => item.status === "pending").length, failed: data.filter((item) => item.status === "failed" || item.status === "expired").length, voucher: data.filter((item) => item.gateway === "voucher").length } }, [response])
  function submitSearch(event: FormEvent<HTMLFormElement>): void { event.preventDefault(); const value = new FormData(event.currentTarget).get("search"); updateParams({ search: typeof value === "string" ? value.trim() || null : null, page: null }) }
  const filtered = Boolean(search || gateway || status || partnerId)

  return <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">Transactions</h1><p className="mt-1 text-sm text-muted-foreground">Pantau Payment tunai, QRIS, Voucher, dan gateway lainnya.</p></div><Button variant="outline" disabled={!response?.data.length} onClick={() => exportPayments(response?.data ?? [])}><Download /> Export Halaman Ini</Button></header>
    {state === "loading" && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32" />)}</div><Skeleton className="h-96" /></>}
    {state === "error" && <Card><CardContent className="grid min-h-64 place-items-center p-6 text-center"><div><p className="font-medium">Payment gagal dimuat</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => setRetry((value) => value + 1)}><RefreshCw /> Coba lagi</Button></div></CardContent></Card>}
    {state === "success" && <><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Ringkasan Payment">{[["Net Dibayar", formatCurrency(summary.net)], ["Dibayar", String(summary.paid)], ["Pending", String(summary.pending)], ["Gagal/Expired", String(summary.failed)], ["Voucher", String(summary.voucher)]].map(([label, value]) => <Card key={label}><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">{label}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">pada halaman ini</p></CardContent></Card>)}</section>
      <Card><CardHeader className="gap-4 border-b"><div><CardTitle>Daftar Payment</CardTitle><CardDescription>Pencarian dan filter diproses oleh backend.</CardDescription></div><div className={`grid gap-3 ${superAdmin ? "lg:grid-cols-[1fr_repeat(3,13rem)_auto]" : "lg:grid-cols-[1fr_repeat(2,13rem)_auto]"}`}><form key={search} className="flex gap-2" onSubmit={submitSearch}><Input name="search" defaultValue={search} placeholder="Cari reference" /><Button type="submit" variant="outline" size="icon" aria-label="Cari"><Search /></Button></form>{superAdmin && <Select value={partnerId ? String(partnerId) : "all"} onValueChange={(value) => value && updateParams({ partner_id: value === "all" ? null : value, page: null })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua Partner</SelectItem>{partners.map((partner) => <SelectItem key={partner.id} value={String(partner.id)}>{partner.brand_name || partner.company_name}</SelectItem>)}</SelectContent></Select>}<Select value={gateway ?? "all"} onValueChange={(value) => value && updateParams({ gateway: value === "all" ? null : value, page: null })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua gateway</SelectItem>{PAYMENT_GATEWAYS.map((item) => <SelectItem key={item} value={item}>{gatewayLabels[item]}</SelectItem>)}</SelectContent></Select><Select value={status ?? "all"} onValueChange={(value) => value && updateParams({ status: value === "all" ? null : value, page: null })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{PAYMENT_STATUSES.map((item) => <SelectItem key={item} value={item}>{statusLabels[item]}</SelectItem>)}</SelectContent></Select><Button variant="ghost" disabled={!filtered} onClick={() => setParams(new URLSearchParams(), { replace: true })}>Reset</Button></div></CardHeader>
        <CardContent className="px-0">{!response || response.data.length === 0 ? <div className="grid min-h-64 place-items-center p-6 text-center"><div><WalletCards className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-medium">{filtered ? "Payment tidak ditemukan" : "Belum ada Payment"}</p></div></div> : <><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Gateway</TableHead><TableHead>Nominal</TableHead><TableHead>Fee</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead><TableHead>Dibayar</TableHead><TableHead>Dibuat</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{response.data.map((payment) => <TableRow key={payment.id}><TableCell className="font-mono text-xs font-medium">{payment.reference}</TableCell><TableCell>{gatewayLabels[payment.gateway]}</TableCell><TableCell className="tabular-nums">{formatCurrency(payment.amount)}</TableCell><TableCell className="tabular-nums">{formatCurrency(payment.fee)}</TableCell><TableCell className="font-medium tabular-nums">{formatCurrency(payment.net_amount)}</TableCell><TableCell><Badge variant={statusVariants[payment.status]}>{statusLabels[payment.status]}</Badge></TableCell><TableCell>{payment.paid_at ? formatDate(payment.paid_at) : "—"}</TableCell><TableCell>{formatDate(payment.created_at)}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Aksi ${payment.reference}`} />}><Ellipsis /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setDetail(payment)}><Eye /> Lihat Detail</DropdownMenuItem>{superAdmin && payment.gateway !== "voucher" && (payment.status === "pending" || payment.status === "paid") && <DropdownMenuItem onClick={() => setTransitioning(payment)}>Ubah Status</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 pt-4 sm:px-6"><p className="text-sm text-muted-foreground">{response.meta.from ?? 0}–{response.meta.to ?? 0} dari {response.meta.total} Payment</p><div className="flex items-center gap-2"><Select value={String(perPage)} onValueChange={(value) => value && updateParams({ per_page: value === "10" ? null : value, page: null })}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{[5, 10, 20, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size} baris</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => updateParams({ page: page - 1 === 1 ? null : String(page - 1) })}><ChevronLeft /> Sebelumnya</Button><Button size="sm" variant="outline" disabled={page >= response.meta.last_page} onClick={() => updateParams({ page: String(page + 1) })}>Berikutnya <ChevronRight /></Button></div></div></>}</CardContent></Card></>}
    {detail && <PaymentDetailDialog payment={detail} open onOpenChange={(open) => !open && setDetail(null)} onUnauthorized={() => void unauthorized()} onForbidden={forbidden} />}
    {transitioning && <PaymentTransitionDialog payment={transitioning} open onOpenChange={(open) => !open && setTransitioning(null)} onSaved={(saved) => { setResponse((current) => current ? { ...current, data: current.data.map((item) => item.id === saved.id ? saved : item) } : current); setDetail((current) => current?.id === saved.id ? saved : current); toast.success(`Payment ${saved.reference} menjadi ${statusLabels[saved.status]}.`) }} onUnauthorized={() => void unauthorized()} onForbidden={forbidden} />}
    <Toaster position="top-right" />
  </div>
}
