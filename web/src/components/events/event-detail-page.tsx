import { ArrowLeft, CalendarDays, CircleAlert, Pencil, RefreshCw, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { EventDeleteDialog } from "@/components/events/event-delete-dialog"
import { EventFormDialog } from "@/components/events/event-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { useAuth } from "@/features/auth/auth-context"
import { getEvent } from "@/features/events/event-service"
import type { EventRecord, EventStatus } from "@/features/events/event.types"
import { ApiError } from "@/lib/api-client"

const statusLabels: Record<EventStatus, string> = { draft: "Draft", scheduled: "Terjadwal", ongoing: "Berlangsung", completed: "Selesai", cancelled: "Dibatalkan" }

function parseId(value: string | undefined): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`))
}

function formatPrice(value: string | number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value))
}

function DetailItem({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{children}</dd></div>
}

function ConfigurationItems({ items }: { readonly items: ReadonlyArray<{ name: string; detail: string }> }) {
  return (
    <div className="grid gap-2">
      {items.map((item, index) => (
        <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 rounded-md border p-3">
          <div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.detail}</p></div>
          {index === 0 && <Badge variant="secondary">Default</Badge>}
        </div>
      ))}
    </div>
  )
}

export function EventDetailPage() {
  const eventId = parseId(useParams<{ eventId: string }>().eventId)
  const location = useLocation()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [loadState, setLoadState] = useState<"loading" | "success" | "not-found" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleUnauthorized = useCallback(async () => {
    await logout()
    navigate("/login", { replace: true, state: { from: location } })
  }, [location, logout, navigate])

  const handleForbidden = useCallback(() => {
    navigate("/admin/forbidden", { replace: true, state: { from: location.pathname } })
  }, [location.pathname, navigate])

  useEffect(() => {
    if (!token || eventId === null) return
    const accessToken = token
    const requestedEventId = eventId
    const controller = new AbortController()

    async function loadEvent() {
      setLoadState("loading")
      setErrorMessage("")
      try {
        const result = await getEvent(accessToken, requestedEventId, controller.signal)
        if (controller.signal.aborted) return
        setEvent(result)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) return void handleUnauthorized()
        if (error instanceof ApiError && error.status === 403) return handleForbidden()
        if (error instanceof ApiError && error.status === 404) return setLoadState("not-found")
        setErrorMessage(error instanceof ApiError ? error.message : "Tidak dapat terhubung ke server.")
        setLoadState("error")
      }
    }

    void loadEvent()
    return () => controller.abort()
  }, [eventId, handleForbidden, handleUnauthorized, retryKey, token])

  if (eventId === null) return <div className="p-6">Alamat Event tidak valid.</div>

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      {loadState === "loading" && <div className="space-y-4" aria-busy><Skeleton className="h-9 w-36" /><Skeleton className="h-16 w-80" /><Skeleton className="h-80 w-full rounded-xl" /></div>}
      {loadState === "not-found" && <Card><CardContent className="grid min-h-72 place-items-center text-center"><div><CalendarDays className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-4 text-xl font-semibold">Event tidak ditemukan</h1><Button className="mt-5" variant="outline" render={<Link to="/admin/events" />}><ArrowLeft aria-hidden="true" /> Daftar Event</Button></div></CardContent></Card>}
      {loadState === "error" && <Card><CardContent className="grid min-h-72 place-items-center text-center"><div><CircleAlert className="mx-auto size-10 text-destructive" /><h1 className="mt-4 text-xl font-semibold">Detail Event gagal dimuat</h1><p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p><Button className="mt-5" onClick={() => setRetryKey((value) => value + 1)}><RefreshCw aria-hidden="true" /> Coba lagi</Button></div></CardContent></Card>}

      {loadState === "success" && event && (
        <>
          <header className="space-y-5">
            <Button variant="ghost" className="-ml-2" render={<Link to="/admin/events" />}><ArrowLeft aria-hidden="true" /> Daftar Event</Button>
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-sm text-muted-foreground">{event.event_code}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{event.event_name}</h1></div><div className="flex gap-2"><Button variant="outline" onClick={() => setEditOpen(true)}><Pencil aria-hidden="true" /> Edit</Button><Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 aria-hidden="true" /> Hapus</Button></div></div>
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>Jadwal Event</CardTitle><CardDescription>Waktu pelaksanaan dan status.</CardDescription></div><Badge variant={event.status === "cancelled" ? "destructive" : event.status === "completed" ? "secondary" : "default"}>{statusLabels[event.status]}</Badge></div></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2"><DetailItem label="Tanggal">{formatDate(event.event_date)}</DetailItem><DetailItem label="Waktu">{event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}</DetailItem><DetailItem label="Harga">{formatPrice(event.price)}</DetailItem><DetailItem label="Batas cetak">{event.print_count_limit === 0 ? "Tanpa batas" : `${event.print_count_limit} cetak`}</DetailItem></dl></CardContent></Card>
            <Card><CardHeader><CardTitle>Booth dan Partner</CardTitle><CardDescription>Lokasi Event serta pembuatnya.</CardDescription></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2"><DetailItem label="Booth">{event.booth.name}</DetailItem><DetailItem label="Lokasi">{event.booth.location || "—"}</DetailItem><DetailItem label="Partner">{event.partner.brand_name || event.partner.company_name}</DetailItem><DetailItem label="Dibuat oleh">{event.created_by.name}</DetailItem></dl></CardContent></Card>
          </div>

          <Card><CardHeader><CardTitle>Snapshot konfigurasi</CardTitle><CardDescription>Konfigurasi disalin ketika Event dibuat sehingga perubahan profile tidak mengubah Event ini.</CardDescription></CardHeader><CardContent className="grid gap-6 lg:grid-cols-2"><div><h3 className="mb-3 text-sm font-medium">Frame tersedia</h3><ConfigurationItems items={(event.configuration.templates ?? [event.configuration.template]).map((template) => ({ name: template.name, detail: `Versi ${template.version}` }))} /></div><div><h3 className="mb-3 text-sm font-medium">Filter tersedia</h3><ConfigurationItems items={(event.configuration.filters ?? [event.configuration.filter]).map((filter) => ({ name: filter.name, detail: `Intensitas ${filter.intensity}% · Versi ${filter.version}` }))} /></div><dl className="grid gap-5 sm:grid-cols-2 lg:col-span-2"><DetailItem label="Camera">Profile #{event.configuration.camera.camera_profile_id} · ISO {event.configuration.camera.iso || "—"} · {event.configuration.camera.burst_count} foto</DetailItem><DetailItem label="Printer">{event.configuration.printer.printer_name} · {event.configuration.printer.copies} salinan · {event.configuration.printer.paper_size}</DetailItem></dl></CardContent></Card>

          <Card><CardHeader><CardTitle>Paket cetak</CardTitle><CardDescription>Pilihan jumlah dan harga cetak yang tersedia untuk Event ini.</CardDescription></CardHeader><CardContent>{(event.configuration.print_options ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Event ini belum memiliki paket cetak.</p> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{(event.configuration.print_options ?? []).map((option) => <div key={option.id} className="rounded-md border p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{option.paper_size.toUpperCase()}</p><Badge variant={option.is_active ? "default" : "secondary"}>{option.is_active ? "Aktif" : "Nonaktif"}</Badge></div><p className="mt-3 text-lg font-semibold">{formatPrice(option.price)}</p><p className="mt-1 text-sm text-muted-foreground">{option.unit_quantity} cetak dasar · tambah per {option.quantity_step}</p></div>)}</div>}</CardContent></Card>

          {editOpen && <EventFormDialog event={event} booths={[]} open onOpenChange={setEditOpen} onSaved={(saved) => { setEvent(saved); toast.success(`Event ${saved.event_name} diperbarui.`) }} onUnauthorized={() => void handleUnauthorized()} onForbidden={handleForbidden} />}
          {deleteOpen && <EventDeleteDialog event={event} open onOpenChange={setDeleteOpen} onDeleted={() => { toast.success(`Event ${event.event_name} dihapus.`); navigate("/admin/events", { replace: true }) }} onUnauthorized={() => void handleUnauthorized()} onForbidden={handleForbidden} />}
        </>
      )}
      <Toaster position="top-right" />
    </div>
  )
}
