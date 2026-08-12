import { Building2, CalendarDays, CircleAlert, Cpu, Eye, Monitor, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isSuperAdmin } from "@/features/auth/auth-access"
import { useAuth } from "@/features/auth/auth-context"
import { getBooths } from "@/features/booths/booth-service"
import type { BoothRecord, BoothStatus } from "@/features/booths/booth.types"
import { getDevices } from "@/features/devices/device-service"
import type { DeviceRecord } from "@/features/devices/device.types"
import { getEvents } from "@/features/events/event-service"
import type { EventRecord, EventStatus } from "@/features/events/event.types"
import { getPartners } from "@/features/partners/partner-service"
import { ApiError } from "@/lib/api-client"

interface OverviewData {
  partnerTotal: number | null
  boothTotal: number | null
  activeBooths: number | null
  deviceTotal: number | null
  onlineDevices: number | null
  staleDevices: number | null
  offlineDevices: number | null
  ongoingEvents: number | null
  booths: ReadonlyArray<BoothRecord>
  events: ReadonlyArray<EventRecord>
  notes: ReadonlyArray<string>
}

const emptyData: OverviewData = {
  partnerTotal: null,
  boothTotal: null,
  activeBooths: null,
  deviceTotal: null,
  onlineDevices: null,
  staleDevices: null,
  offlineDevices: null,
  ongoingEvents: null,
  booths: [],
  events: [],
  notes: [],
}

const boothStatusLabels: Record<BoothStatus, string> = { active: "Aktif", maintenance: "Maintenance", inactive: "Nonaktif" }
const eventStatusLabels: Record<EventStatus, string> = { draft: "Draft", scheduled: "Terjadwal", ongoing: "Berlangsung", completed: "Selesai", cancelled: "Dibatalkan" }

function rejection(result: PromiseSettledResult<unknown>): unknown {
  return result.status === "rejected" ? result.reason : null
}

function accessNote(label: string, result: PromiseSettledResult<unknown>): string | null {
  const error = rejection(result)
  if (!error) return null
  if (error instanceof ApiError && error.status === 403) return `${label} tidak tersedia karena role belum memiliki permission.`
  return `${label} gagal dimuat.`
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`))
}

function StatCard({ icon: Icon, label, value, description }: { readonly icon: typeof Building2; readonly label: string; readonly value: string; readonly description: string }) {
  return <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardDescription>{label}</CardDescription><Icon className="size-5 text-muted-foreground" aria-hidden="true" /></div><CardTitle className="text-3xl tabular-nums">{value}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{description}</p></CardContent></Card>
}

export default function OverviewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token, user, logout } = useAuth()
  const superAdmin = isSuperAdmin(user)
  const [data, setData] = useState<OverviewData>(emptyData)
  const [loadState, setLoadState] = useState<"loading" | "success">("loading")
  const [retryKey, setRetryKey] = useState(0)

  const handleUnauthorized = useCallback(async () => {
    await logout()
    navigate("/login", { replace: true, state: { from: location } })
  }, [location, logout, navigate])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    const controller = new AbortController()

    async function loadOverview() {
      setLoadState("loading")
      const results = await Promise.allSettled([
        getBooths(accessToken, { per_page: 100, sort: "created_at", direction: "desc" }, controller.signal),
        getEvents(accessToken, { status: "ongoing", per_page: 5 }, controller.signal),
        getEvents(accessToken, { sort: "event_date", direction: "desc", per_page: 5 }, controller.signal),
        superAdmin ? getPartners(accessToken, { per_page: 5 }, controller.signal) : Promise.resolve(null),
        getDevices(accessToken, { per_page: 100 }, controller.signal),
      ] as const)
      if (controller.signal.aborted) return

      const unauthorized = results.some((result) => {
        const error = rejection(result)
        return error instanceof ApiError && error.status === 401
      })
      if (unauthorized) return void handleUnauthorized()

      const [boothsResult, ongoingResult, eventsResult, partnersResult, devicesResult] = results
      const boothsResponse = boothsResult.status === "fulfilled" ? boothsResult.value : null
      const ongoingResponse = ongoingResult.status === "fulfilled" ? ongoingResult.value : null
      const eventsResponse = eventsResult.status === "fulfilled" ? eventsResult.value : null
      const partnersResponse = partnersResult.status === "fulfilled" ? partnersResult.value : null
      const devicesResponse = devicesResult.status === "fulfilled" ? devicesResult.value : null
      const devices: ReadonlyArray<DeviceRecord> = devicesResponse?.data ?? []
      const notes = [
        accessNote("Data Booth dan perangkat", boothsResult),
        accessNote("Jumlah Event berlangsung", ongoingResult),
        accessNote("Daftar Event terbaru", eventsResult),
        superAdmin ? accessNote("Jumlah Partner", partnersResult) : null,
        accessNote("Status perangkat", devicesResult),
      ].filter((note): note is string => Boolean(note))

      setData({
        partnerTotal: superAdmin ? partnersResponse?.meta.total ?? null : user?.partner ? 1 : 0,
        boothTotal: boothsResponse?.meta.total ?? null,
        activeBooths: boothsResponse ? boothsResponse.data.filter((booth) => booth.status === "active").length : null,
        deviceTotal: devicesResponse?.meta.total ?? null,
        onlineDevices: devicesResponse ? devices.filter((device) => device.presence_status === "online").length : null,
        staleDevices: devicesResponse ? devices.filter((device) => device.presence_status === "stale").length : null,
        offlineDevices: devicesResponse ? devices.filter((device) => device.presence_status === "offline").length : null,
        ongoingEvents: ongoingResponse?.meta.total ?? null,
        booths: boothsResponse?.data ?? [],
        events: eventsResponse?.data ?? [],
        notes,
      })
      setLoadState("success")
    }

    void loadOverview()
    return () => controller.abort()
  }, [handleUnauthorized, retryKey, superAdmin, token, user?.partner])

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-semibold tracking-tight">Beranda</h1><p className="mt-1 text-sm text-muted-foreground">Ringkasan operasional menggunakan data backend.</p></div><Button variant="outline" disabled={loadState === "loading"} onClick={() => setRetryKey((value) => value + 1)}><RefreshCw className={loadState === "loading" ? "animate-spin" : ""} aria-hidden="true" /> Refresh</Button></header>

      {loadState === "loading" ? <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy>{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-40 rounded-xl" />)}</div><Skeleton className="h-80 rounded-xl" /><Skeleton className="h-80 rounded-xl" /></> : <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistik backend"><StatCard icon={Building2} label="Partner/Kiosk" value={data.partnerTotal?.toLocaleString("id-ID") ?? "—"} description={superAdmin ? "Partner terdaftar" : "Partner akun ini"} /><StatCard icon={Monitor} label="Booth" value={data.boothTotal?.toLocaleString("id-ID") ?? "—"} description={`${data.activeBooths ?? 0} Booth berstatus aktif pada data termuat`} /><StatCard icon={CalendarDays} label="Event aktif" value={data.ongoingEvents?.toLocaleString("id-ID") ?? "—"} description="Event berstatus berlangsung" /><StatCard icon={Cpu} label="Perangkat" value={data.deviceTotal?.toLocaleString("id-ID") ?? "—"} description={`${data.onlineDevices ?? 0} online · ${data.staleDevices ?? 0} stale · ${data.offlineDevices ?? 0} offline`} /></section>

        {data.notes.length > 0 && <Card><CardContent className="flex items-start gap-3 p-4"><CircleAlert className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><div><p className="font-medium">Keterangan data</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{data.notes.map((note) => <li key={note}>{note}</li>)}</ul></div></CardContent></Card>}

        <Card><CardHeader><CardTitle>Booth terbaru</CardTitle><CardDescription>Status Booth dan jumlah perangkat terdaftar.</CardDescription></CardHeader><CardContent>{data.booths.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Data Booth belum tersedia.</p> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Booth</TableHead><TableHead>Partner</TableHead><TableHead>Status</TableHead><TableHead>Perangkat</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{data.booths.slice(0, 8).map((booth) => <TableRow key={booth.id}><TableCell><div className="font-medium">{booth.name}</div><div className="text-xs text-muted-foreground">{booth.location || "Lokasi belum diisi"}</div></TableCell><TableCell>{booth.partner.brand_name || booth.partner.company_name}</TableCell><TableCell><Badge variant={booth.status === "active" ? "default" : "secondary"}>{boothStatusLabels[booth.status]}</Badge></TableCell><TableCell>{booth.devices_count ?? 0}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" render={<Link to={`/admin/kiosk/${booth.partner.id}/booths/${booth.id}`} />}><Eye aria-hidden="true" /> Detail</Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>

        <Card><CardHeader><CardTitle>Event terbaru</CardTitle><CardDescription>Jadwal Event dari endpoint `/api/v1/events`.</CardDescription></CardHeader><CardContent>{data.events.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Data Event belum tersedia.</p> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Tanggal</TableHead><TableHead>Booth</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{data.events.map((event) => <TableRow key={event.id}><TableCell><div className="font-medium">{event.event_name}</div><div className="font-mono text-xs text-muted-foreground">{event.event_code}</div></TableCell><TableCell>{formatDate(event.event_date)}</TableCell><TableCell>{event.booth.name}</TableCell><TableCell><Badge variant={event.status === "cancelled" ? "destructive" : event.status === "completed" ? "secondary" : "default"}>{eventStatusLabels[event.status]}</Badge></TableCell><TableCell className="text-right"><Button size="sm" variant="outline" render={<Link to={`/admin/events/${event.id}`} />}><Eye aria-hidden="true" /> Detail</Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
      </>}
    </div>
  )
}
