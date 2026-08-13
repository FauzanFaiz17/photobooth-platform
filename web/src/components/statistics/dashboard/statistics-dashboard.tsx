import {
  Banknote,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Image,
  Monitor,
  Printer,
  RefreshCw,
  Store,
  Users,
  WalletCards,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isSuperAdmin } from "@/features/auth/auth-access"
import { useAuth } from "@/features/auth/auth-context"
import { getPartners } from "@/features/partners/partner-service"
import type { PartnerRecord } from "@/features/partners/partner.types"
import { getAdminDailyReports, getDailyReports, getMonthlyReports } from "@/features/reports/report-service"
import type { AdminDailyReport, PartnerDailyReport, PartnerMonthlyReport, ReportPage } from "@/features/reports/report.types"
import { ApiError } from "@/lib/api-client"

type ReportTab = "daily" | "monthly" | "admin"
type ReportResult =
  | { type: "daily"; page: ReportPage<PartnerDailyReport> }
  | { type: "monthly"; page: ReportPage<PartnerMonthlyReport> }
  | { type: "admin"; page: ReportPage<AdminDailyReport> }

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
const integer = new Intl.NumberFormat("id-ID")
const date = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" })
const month = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" })

function formatDate(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : date.format(parsed)
}

function formatMonth(year: number, monthNumber: number): string {
  return month.format(new Date(year, monthNumber - 1, 1))
}

function MetricCard({ label, value, icon: Icon }: { readonly label: string; readonly value: string; readonly icon: typeof Banknote }): ReactElement {
  return <Card><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></div><div className="grid size-10 shrink-0 place-items-center rounded-md bg-muted"><Icon className="size-5" aria-hidden="true" /></div></CardContent></Card>
}

function Pagination({ page, onChange }: { readonly page: ReportPageMeta; readonly onChange: (page: number) => void }): ReactElement {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4"><p className="text-sm text-muted-foreground">{page.from ?? 0}–{page.to ?? 0} dari {page.total} laporan</p><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page.current_page <= 1} onClick={() => onChange(page.current_page - 1)}><ChevronLeft aria-hidden="true" /> Sebelumnya</Button><span className="min-w-20 text-center text-sm">{page.current_page} / {Math.max(1, page.last_page)}</span><Button size="sm" variant="outline" disabled={page.current_page >= page.last_page} onClick={() => onChange(page.current_page + 1)}>Berikutnya <ChevronRight aria-hidden="true" /></Button></div></div>
}

type ReportPageMeta = ReportPage<PartnerDailyReport>["meta"]

function DailyContent({ result, partnerNames }: { readonly result: ReportPage<PartnerDailyReport>; readonly partnerNames: ReadonlyMap<number, string> }): ReactElement {
  const totals = result.data.reduce((sum, item) => ({ revenue: sum.revenue + Number(item.total_revenue), sessions: sum.sessions + item.total_sessions, customers: sum.customers + item.total_customers, prints: sum.prints + item.total_prints, downloads: sum.downloads + item.total_downloads }), { revenue: 0, sessions: 0, customers: 0, prints: 0, downloads: 0 })
  return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="Pendapatan di halaman ini" value={currency.format(totals.revenue)} icon={Banknote} /><MetricCard label="Sesi" value={integer.format(totals.sessions)} icon={CalendarDays} /><MetricCard label="Customer" value={integer.format(totals.customers)} icon={Users} /><MetricCard label="Hasil cetak" value={integer.format(totals.prints)} icon={Printer} /><MetricCard label="Download" value={integer.format(totals.downloads)} icon={Download} /></div><ReportTable title="Laporan Harian" description="Ringkasan aktivitas harian yang sudah diagregasi backend."><Table><TableHeader><TableRow><TableHead>Tanggal</TableHead>{partnerNames.size > 0 && <TableHead>Partner</TableHead>}<TableHead className="text-right">Pendapatan</TableHead><TableHead className="text-right">Sesi</TableHead><TableHead className="text-right">Customer</TableHead><TableHead className="text-right">Cetak</TableHead><TableHead className="text-right">Download</TableHead></TableRow></TableHeader><TableBody>{result.data.map((item) => <TableRow key={item.id}><TableCell>{formatDate(item.stat_date)}</TableCell>{partnerNames.size > 0 && <TableCell>{partnerNames.get(item.partner_id) ?? `Partner #${item.partner_id}`}</TableCell>}<TableCell className="text-right tabular-nums">{currency.format(Number(item.total_revenue))}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_sessions)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_customers)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_prints)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_downloads)}</TableCell></TableRow>)}</TableBody></Table></ReportTable></>
}

function MonthlyContent({ result, partnerNames }: { readonly result: ReportPage<PartnerMonthlyReport>; readonly partnerNames: ReadonlyMap<number, string> }): ReactElement {
  const totals = result.data.reduce((sum, item) => ({ revenue: sum.revenue + Number(item.total_revenue), sessions: sum.sessions + item.total_sessions, customers: sum.customers + item.total_customers, media: sum.media + item.total_media, payments: sum.payments + item.total_qris_transactions }), { revenue: 0, sessions: 0, customers: 0, media: 0, payments: 0 })
  return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="Pendapatan di halaman ini" value={currency.format(totals.revenue)} icon={Banknote} /><MetricCard label="Sesi" value={integer.format(totals.sessions)} icon={CalendarDays} /><MetricCard label="Customer" value={integer.format(totals.customers)} icon={Users} /><MetricCard label="Media" value={integer.format(totals.media)} icon={Image} /><MetricCard label="Payment QRIS" value={integer.format(totals.payments)} icon={WalletCards} /></div><ReportTable title="Laporan Bulanan" description="Ringkasan bulanan Partner, termasuk media, voucher, dan transaksi QRIS."><Table><TableHeader><TableRow><TableHead>Periode</TableHead>{partnerNames.size > 0 && <TableHead>Partner</TableHead>}<TableHead className="text-right">Pendapatan</TableHead><TableHead className="text-right">Sesi</TableHead><TableHead className="text-right">Customer</TableHead><TableHead className="text-right">Voucher</TableHead><TableHead className="text-right">Payment</TableHead><TableHead className="text-right">Cetak</TableHead><TableHead className="text-right">Download</TableHead><TableHead className="text-right">Media</TableHead></TableRow></TableHeader><TableBody>{result.data.map((item) => <TableRow key={item.id}><TableCell>{formatMonth(item.period_year, item.period_month)}</TableCell>{partnerNames.size > 0 && <TableCell>{partnerNames.get(item.partner_id) ?? `Partner #${item.partner_id}`}</TableCell>}<TableCell className="text-right tabular-nums">{currency.format(Number(item.total_revenue))}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_sessions)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_customers)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_vouchers_used)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_qris_transactions)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_prints)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_downloads)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_media)}</TableCell></TableRow>)}</TableBody></Table></ReportTable></>
}

function AdminContent({ result }: { readonly result: ReportPage<AdminDailyReport> }): ReactElement {
  const latest = result.data[0]
  const totals = result.data.reduce((sum, item) => ({ sessions: sum.sessions + item.total_sessions, payments: sum.payments + item.total_payments, media: sum.media + item.total_media }), { sessions: 0, payments: 0, media: 0 })
  return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Partner terbaru" value={integer.format(latest?.total_partners ?? 0)} icon={Building2} /><MetricCard label="Booth terbaru" value={integer.format(latest?.total_booths ?? 0)} icon={Store} /><MetricCard label="Device terbaru" value={integer.format(latest?.total_devices ?? 0)} icon={Monitor} /><MetricCard label="Event terbaru" value={integer.format(latest?.total_events ?? 0)} icon={CalendarDays} /><MetricCard label="Sesi di halaman ini" value={integer.format(totals.sessions)} icon={Users} /><MetricCard label="Payment di halaman ini" value={integer.format(totals.payments)} icon={WalletCards} /><MetricCard label="Media di halaman ini" value={integer.format(totals.media)} icon={Image} /></div><ReportTable title="Laporan Platform Harian" description="Jumlah entitas memakai snapshot terbaru; aktivitas dijumlahkan untuk halaman saat ini."><Table><TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead className="text-right">Partner</TableHead><TableHead className="text-right">Booth</TableHead><TableHead className="text-right">Device</TableHead><TableHead className="text-right">Event</TableHead><TableHead className="text-right">Sesi</TableHead><TableHead className="text-right">Payment</TableHead><TableHead className="text-right">Media</TableHead><TableHead className="text-right">Print job</TableHead><TableHead className="text-right">Upload</TableHead><TableHead className="text-right">Download</TableHead></TableRow></TableHeader><TableBody>{result.data.map((item) => <TableRow key={item.id}><TableCell>{formatDate(item.stat_date)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_partners)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_booths)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_devices)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_events)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_sessions)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_payments)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_media)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_print_jobs)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_uploads)}</TableCell><TableCell className="text-right tabular-nums">{integer.format(item.total_downloads)}</TableCell></TableRow>)}</TableBody></Table></ReportTable></>
}

function ReportTable({ title, description, children }: { readonly title: string; readonly description: string; readonly children: ReactElement }): ReactElement {
  return <Card className="overflow-hidden"><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="p-0">{children}</CardContent></Card>
}

export function StatisticsDashboard(): ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, user, logout } = useAuth()
  const superAdmin = isSuperAdmin(user)
  const [tab, setTab] = useState<ReportTab>("daily")
  const [page, setPage] = useState(1)
  const [partnerId, setPartnerId] = useState("all")
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([])
  const [result, setResult] = useState<ReportResult | null>(null)
  const [state, setState] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const partnerNames = useMemo(() => new Map(partners.map((partner) => [partner.id, partner.company_name])), [partners])

  const unauthorized = useCallback(async () => {
    await logout()
    navigate("/login", { replace: true, state: { from: location } })
  }, [location, logout, navigate])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    const controller = new AbortController()
    async function load(): Promise<void> {
      setState("loading")
      setError("")
      try {
        const selectedPartner = partnerId === "all" ? undefined : Number(partnerId)
        const [report, partnerResult] = await Promise.all([
          tab === "daily" ? getDailyReports(accessToken, page, controller.signal, selectedPartner).then((value): ReportResult => ({ type: "daily", page: value })) : tab === "monthly" ? getMonthlyReports(accessToken, page, controller.signal, selectedPartner).then((value): ReportResult => ({ type: "monthly", page: value })) : getAdminDailyReports(accessToken, page, controller.signal).then((value): ReportResult => ({ type: "admin", page: value })),
          superAdmin && partners.length === 0 ? getPartners(accessToken, { per_page: 100 }, controller.signal) : Promise.resolve(null),
        ])
        if (controller.signal.aborted) return
        if (page > Math.max(1, report.page.meta.last_page)) {
          setPage(Math.max(1, report.page.meta.last_page))
          return
        }
        if (partnerResult) setPartners(partnerResult.data)
        setResult(report)
        setState("success")
      } catch (caught: unknown) {
        if (controller.signal.aborted) return
        if (caught instanceof ApiError && caught.status === 401) return void unauthorized()
        setResult(null)
        setError(caught instanceof ApiError ? caught.message : "Tidak dapat terhubung ke server.")
        setState("error")
      }
    }
    void load()
    return () => controller.abort()
  }, [page, partnerId, partners.length, retryKey, superAdmin, tab, token, unauthorized])

  function changeTab(value: string): void {
    const next = value === "monthly" ? "monthly" : value === "admin" && superAdmin ? "admin" : "daily"
    setTab(next)
    setPage(1)
  }

  const activePage = result?.page.meta
  const empty = state === "success" && result?.page.data.length === 0

  return <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8"><header><h1 className="text-2xl font-semibold">Statistics</h1><p className="mt-1 text-sm text-muted-foreground">Data laporan teragregasi dari backend.</p></header><div className="flex flex-wrap items-end justify-between gap-3"><Tabs value={tab} onValueChange={changeTab}><TabsList><TabsTrigger value="daily">Harian</TabsTrigger><TabsTrigger value="monthly">Bulanan</TabsTrigger>{superAdmin && <TabsTrigger value="admin">Platform Harian</TabsTrigger>}</TabsList></Tabs>{superAdmin && tab !== "admin" && <div className="w-full sm:w-64"><Select value={partnerId} onValueChange={(value) => { if (value !== null) { setPartnerId(value); setPage(1) } }}><SelectTrigger aria-label="Filter Partner"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua Partner</SelectItem>{partners.map((partner) => <SelectItem key={partner.id} value={String(partner.id)}>{partner.company_name}</SelectItem>)}</SelectContent></Select></div>}</div>{state === "loading" && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-busy>{[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28" />)}</div><Skeleton className="h-96" /></>}{state === "error" && <Card><CardContent className="grid min-h-72 place-items-center text-center"><div><CircleAlert className="mx-auto size-10 text-destructive" aria-hidden="true" /><p className="mt-3 font-medium">Statistics gagal dimuat</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => setRetryKey((value) => value + 1)}><RefreshCw aria-hidden="true" /> Coba lagi</Button></div></CardContent></Card>}{empty && <Card><CardContent className="grid min-h-72 place-items-center text-center"><div><CalendarDays className="mx-auto size-10 text-muted-foreground" aria-hidden="true" /><p className="mt-3 font-medium">Belum ada data laporan</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Backend belum menghasilkan data agregasi untuk laporan ini.</p></div></CardContent></Card>}{state === "success" && result && result.page.data.length > 0 && <>{result.type === "daily" && <DailyContent result={result.page} partnerNames={superAdmin ? partnerNames : new Map()} />}{result.type === "monthly" && <MonthlyContent result={result.page} partnerNames={superAdmin ? partnerNames : new Map()} />}{result.type === "admin" && <AdminContent result={result.page} />}{activePage && <Pagination page={activePage} onChange={setPage} />}</>}</div>
}
