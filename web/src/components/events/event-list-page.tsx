import { CalendarDays, ChevronLeft, ChevronRight, Eye, Plus, RefreshCw, Search } from "lucide-react"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { EventFormDialog } from "@/components/events/event-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/features/auth/auth-context"
import { getBooths } from "@/features/booths/booth-service"
import type { BoothRecord } from "@/features/booths/booth.types"
import { getEvents } from "@/features/events/event-service"
import { isEventStatus, type EventListResponse, type EventStatus } from "@/features/events/event.types"
import { ApiError } from "@/lib/api-client"

const statusLabels: Record<EventStatus, string> = {
  draft: "Draft",
  scheduled: "Terjadwal",
  ongoing: "Berlangsung",
  completed: "Selesai",
  cancelled: "Dibatalkan",
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`))
}

function formatPrice(value: string | number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value))
}

export function EventListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { token, logout } = useAuth()
  const querySearch = searchParams.get("search") ?? ""
  const statusParam = searchParams.get("status")
  const status = isEventStatus(statusParam) ? statusParam : "all"
  const boothId = parsePositiveInteger(searchParams.get("booth_id"), 0)
  const dateFrom = searchParams.get("date_from") ?? ""
  const dateTo = searchParams.get("date_to") ?? ""
  const page = parsePositiveInteger(searchParams.get("page"), 1)
  const [response, setResponse] = useState<EventListResponse | null>(null)
  const [booths, setBooths] = useState<ReadonlyArray<BoothRecord>>([])
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  const updateQuery = useCallback((updates: Readonly<Record<string, string | null>>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      return next
    }, { replace: true })
  }, [setSearchParams])

  const handleUnauthorized = useCallback(async () => {
    await logout()
    navigate("/login", { replace: true })
  }, [logout, navigate])

  const handleForbidden = useCallback(() => {
    navigate("/admin/forbidden", { replace: true, state: { from: "/admin/events" } })
  }, [navigate])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    const controller = new AbortController()

    async function loadEvents() {
      setLoadState("loading")
      setErrorMessage("")
      try {
        const [eventsResult, boothsResult] = await Promise.all([
          getEvents(accessToken, {
            search: querySearch || undefined,
            status: status === "all" ? undefined : status,
            booth_id: boothId || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            sort: "event_date",
            direction: "desc",
            per_page: 10,
            page,
          }, controller.signal),
          // ponytail: first 100 booths cover the current selector; add async lookup when this limit is reached.
          getBooths(accessToken, { per_page: 100 }, controller.signal),
        ])
        if (controller.signal.aborted) return
        if (page > Math.max(1, eventsResult.meta.last_page)) {
          updateQuery({ page: eventsResult.meta.last_page > 1 ? String(eventsResult.meta.last_page) : null })
          return
        }
        setResponse(eventsResult)
        setBooths(boothsResult.data)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) return void handleUnauthorized()
        if (error instanceof ApiError && error.status === 403) return handleForbidden()
        setResponse(null)
        setErrorMessage(error instanceof ApiError ? error.message : "Tidak dapat terhubung ke server.")
        setLoadState("error")
      }
    }

    void loadEvents()

    return () => controller.abort()
  }, [boothId, dateFrom, dateTo, handleForbidden, handleUnauthorized, page, querySearch, retryKey, status, token, updateQuery])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get("search")
    updateQuery({ search: typeof value === "string" ? value.trim() || null : null, page: null })
  }

  const filtered = Boolean(querySearch || status !== "all" || boothId || dateFrom || dateTo)

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Events</h1><p className="mt-1 text-sm text-muted-foreground">Kelola jadwal dan konfigurasi Event setiap Booth.</p></div>
        <Button onClick={() => setCreateOpen(true)} disabled={loadState !== "success"}><Plus aria-hidden="true" /> Tambah Event</Button>
      </header>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div><CardTitle>Daftar Event</CardTitle><CardDescription>Pencarian dan filter diproses oleh backend.</CardDescription></div>
          <div className="grid gap-3 lg:grid-cols-[minmax(12rem,1fr)_repeat(4,minmax(9rem,auto))_auto]">
            <form key={querySearch} className="flex gap-2" onSubmit={submitSearch}><Label className="sr-only" htmlFor="event-search">Cari Event</Label><Input id="event-search" name="search" defaultValue={querySearch} placeholder="Nama atau kode Event" /><Button type="submit" variant="outline" size="icon" aria-label="Cari"><Search aria-hidden="true" /></Button></form>
            <Select<string> value={status} onValueChange={(value) => value !== null && updateQuery({ status: value === "all" ? null : value, page: null })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
            <Select<string> value={boothId ? String(boothId) : "all"} onValueChange={(value) => value !== null && updateQuery({ booth_id: value === "all" ? null : value, page: null })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua Booth</SelectItem>{booths.map((booth) => <SelectItem key={booth.id} value={String(booth.id)}>{booth.name}</SelectItem>)}</SelectContent></Select>
            <Input type="date" aria-label="Tanggal mulai" value={dateFrom} max={dateTo || undefined} onChange={(event) => updateQuery({ date_from: event.target.value || null, date_to: dateTo && event.target.value > dateTo ? null : dateTo || null, page: null })} />
            <Input type="date" aria-label="Tanggal akhir" value={dateTo} min={dateFrom || undefined} onChange={(event) => updateQuery({ date_to: event.target.value || null, page: null })} />
            <Button variant="ghost" disabled={!filtered} onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}>Reset</Button>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {loadState === "loading" && <div className="space-y-3 p-6" aria-busy>{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full" />)}</div>}
          {loadState === "error" && <div className="grid min-h-64 place-items-center p-6 text-center"><div><p className="font-medium">Daftar Event gagal dimuat</p><p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p><Button className="mt-4" variant="outline" onClick={() => setRetryKey((value) => value + 1)}><RefreshCw aria-hidden="true" /> Coba lagi</Button></div></div>}
          {loadState === "success" && response && response.data.length === 0 && <div className="grid min-h-64 place-items-center p-6 text-center"><div><CalendarDays className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-medium">{filtered ? "Event tidak ditemukan" : "Belum ada Event"}</p><p className="mt-1 text-sm text-muted-foreground">{filtered ? "Ubah atau reset filter pencarian." : "Tambahkan Event pertama untuk salah satu Booth."}</p></div></div>}
          {loadState === "success" && response && response.data.length > 0 && (
            <>
              <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Jadwal</TableHead><TableHead>Booth</TableHead><TableHead>Status</TableHead><TableHead>Harga</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{response.data.map((event) => <TableRow key={event.id}><TableCell><div className="font-medium">{event.event_name}</div><div className="font-mono text-xs text-muted-foreground">{event.event_code}</div></TableCell><TableCell><div>{formatDate(event.event_date)}</div><div className="text-xs text-muted-foreground">{event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}</div></TableCell><TableCell><div>{event.booth.name}</div><div className="text-xs text-muted-foreground">{event.partner.brand_name || event.partner.company_name}</div></TableCell><TableCell><Badge variant={event.status === "cancelled" ? "destructive" : event.status === "completed" ? "secondary" : "default"}>{statusLabels[event.status]}</Badge></TableCell><TableCell>{formatPrice(event.price)}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" render={<Link to={`/admin/events/${event.id}`} />}><Eye aria-hidden="true" /> Detail</Button></TableCell></TableRow>)}</TableBody></Table></div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 pt-4 sm:px-6"><p className="text-sm text-muted-foreground">{response.meta.from ?? 0}–{response.meta.to ?? 0} dari {response.meta.total} Event</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={response.meta.current_page <= 1} onClick={() => updateQuery({ page: response.meta.current_page - 1 === 1 ? null : String(response.meta.current_page - 1) })}><ChevronLeft aria-hidden="true" /> Sebelumnya</Button><Button size="sm" variant="outline" disabled={response.meta.current_page >= response.meta.last_page} onClick={() => updateQuery({ page: String(response.meta.current_page + 1) })}>Berikutnya <ChevronRight aria-hidden="true" /></Button></div></div>
            </>
          )}
        </CardContent>
      </Card>

      {createOpen && <EventFormDialog event={null} booths={booths} open onOpenChange={setCreateOpen} onSaved={(saved) => { toast.success(`Event ${saved.event_name} ditambahkan.`); navigate(`/admin/events/${saved.id}`) }} onUnauthorized={() => void handleUnauthorized()} onForbidden={handleForbidden} />}
      <Toaster position="top-right" />
    </div>
  )
}
