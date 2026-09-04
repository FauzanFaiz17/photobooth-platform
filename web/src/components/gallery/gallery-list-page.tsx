import { Building2, ChevronLeft, ChevronRight, CircleAlert, Copy, ExternalLink, Images, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState, type ReactElement } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { isSuperAdmin } from "@/features/auth/auth-access"
import { useAuth } from "@/features/auth/auth-context"
import { fetchGalleryMediaUrl, getGalleries } from "@/features/galleries/gallery-service"
import type { GalleryListResponse, GalleryRecord } from "@/features/galleries/gallery.types"
import { getPartners } from "@/features/partners/partner-service"
import type { PartnerRecord } from "@/features/partners/partner.types"
import { getEvents } from "@/features/events/event-service"
import type { EventRecord } from "@/features/events/event.types"
import { ApiError } from "@/lib/api-client"

import { GalleryDetailDialog } from "./gallery-detail-dialog"

const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" })

function formatDate(value: string | null): string {
  if (!value) return "—"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "—" : dateFormat.format(parsed)
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

/** Backend mengirim gallery_url absolut ke domain web; dashboard sudah punya route /gallery/:token. */
function galleryPath(url: string): string | null {
  try {
    return new URL(url).pathname
  } catch {
    return null
  }
}

function expiryState(expiresAt: string | null): { label: string; expired: boolean } {
  if (!expiresAt) return { label: "Tanpa batas", expired: false }
  const parsed = new Date(expiresAt)
  if (Number.isNaN(parsed.getTime())) return { label: "Tanpa batas", expired: false }
  const expired = parsed.getTime() <= Date.now()
  return { label: expired ? "Kedaluwarsa" : `Aktif s/d ${formatDate(expiresAt)}`, expired }
}

function mediaSummary(media: GalleryRecord["media"]): string {
  const counts = new Map<string, number>()
  for (const item of media) counts.set(item.type, (counts.get(item.type) ?? 0) + 1)
  return [...counts].map(([type, count]) => `${count} ${type}`).join(" · ") || "Belum ada media"
}

function galleryToken(url: string | null): string | null {
  const path = url ? galleryPath(url) : null
  return path?.match(/\/gallery\/([A-Za-z0-9]{64})$/)?.[1] ?? null
}

/** Komposit final mewakili sesi paling baik; sisanya hanya potongan mentah. */
function coverMedia(media: GalleryRecord["media"]): GalleryRecord["media"][number] | null {
  const images = media.filter((item) => item.mime_type.startsWith("image/"))
  return images.find((item) => item.type === "template") ?? images[0] ?? null
}

function GalleryCover({ gallery }: { readonly gallery: GalleryRecord }): ReactElement {
  const token = galleryToken(gallery.gallery_url)
  const cover = coverMedia(gallery.media)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    if (!token || !cover) return
    const controller = new AbortController()
    let created: string | null = null

    fetchGalleryMediaUrl(token, cover.id, controller.signal)
      .then((url) => {
        if (controller.signal.aborted) return void URL.revokeObjectURL(url)
        created = url
        setObjectUrl(url)
      })
      .catch(() => {
        if (!controller.signal.aborted) setBroken(true)
      })

    return () => {
      controller.abort()
      if (created) URL.revokeObjectURL(created)
    }
  }, [cover, token])

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden border-b bg-muted/40">
      {objectUrl ? (
        <img src={objectUrl} alt={`Media sesi ${gallery.id}`} className="absolute inset-0 size-full object-contain p-2" />
      ) : (
        <div className="absolute inset-0 grid place-items-center gap-1 text-center">
          <Images className="size-10 text-muted-foreground" aria-hidden="true" />
          {(broken || !token || !cover) && (
            <span className="px-3 text-[11px] leading-tight text-muted-foreground">
              {!cover ? "Tidak ada gambar" : !token ? "Link gallery belum dibuat" : "Media belum bisa dimuat"}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function GalleryCard({ gallery }: { readonly gallery: GalleryRecord }): ReactElement {
  const navigate = useNavigate()
  const expiry = expiryState(gallery.expires_at)
  const path = gallery.gallery_url ? galleryPath(gallery.gallery_url) : null
  const token = galleryToken(gallery.gallery_url)
  const [detailOpen, setDetailOpen] = useState(false)

  async function copyLink() {
    if (!gallery.gallery_url) return
    try {
      await navigator.clipboard.writeText(gallery.gallery_url)
      toast.success("Link gallery disalin.")
    } catch {
      toast.error("Link gagal disalin. Salin manual dari kolom link.")
    }
  }

  return (
    <Card className="overflow-hidden pt-0">
      <GalleryCover gallery={gallery} />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{gallery.customer?.name || `Sesi #${gallery.id}`}</CardTitle>
            <CardDescription className="mt-1 truncate">{gallery.customer?.email || gallery.customer?.phone || "Tanpa data customer"}</CardDescription>
          </div>
          <Badge variant={expiry.expired ? "destructive" : "secondary"}>{expiry.expired ? "Kedaluwarsa" : "Aktif"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Media</dt>
            <dd className="mt-1 font-medium">{gallery.media.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Selesai</dt>
            <dd className="mt-1 font-medium">{formatDate(gallery.completed_at)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Rincian</dt>
            <dd className="mt-1 font-medium">{mediaSummary(gallery.media)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Masa berlaku</dt>
            <dd className="mt-1 font-medium">{expiry.label}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Link gallery</dt>
            <dd className="mt-1 truncate font-medium" title={gallery.gallery_url ?? undefined}>{gallery.gallery_url || "Belum dibuat"}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" disabled={!gallery.gallery_url} onClick={() => void copyLink()}>
          <Copy aria-hidden="true" /> Salin link
        </Button>
        <Button size="sm" variant="outline" disabled={!token || gallery.media.length === 0} onClick={() => setDetailOpen(true)}>
          <Images aria-hidden="true" /> Lihat media
        </Button>
        <Button size="sm" disabled={!path} onClick={() => path && navigate(path)}>
          <ExternalLink aria-hidden="true" /> Buka Gallery
        </Button>
      </CardFooter>

      {detailOpen && (
        <GalleryDetailDialog gallery={gallery} galleryToken={token} open onOpenChange={setDetailOpen} />
      )}
    </Card>
  )
}

export function GalleryListPage(): ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { token, user, logout } = useAuth()
  const superAdmin = isSuperAdmin(user)
  const partnerParam = searchParams.get("partner_id")
  const eventParam = searchParams.get("event_id")
  const page = parsePositiveInteger(searchParams.get("page"), 1)
  const [response, setResponse] = useState<GalleryListResponse | null>(null)
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([])
  const [events, setEvents] = useState<ReadonlyArray<EventRecord>>([])
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)

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
    navigate("/login", { replace: true, state: { from: location } })
  }, [location, logout, navigate])

  const handleForbidden = useCallback(() => {
    navigate("/admin/forbidden", { replace: true, state: { from: location.pathname } })
  }, [location.pathname, navigate])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    const controller = new AbortController()
    const partnerId = superAdmin ? parsePositiveInteger(partnerParam, 0) : 0

    async function loadGalleries() {
      setLoadState("loading")
      setErrorMessage("")
      try {
        const [galleriesResult, partnersResult, eventsResult] = await Promise.all([
          getGalleries(accessToken, { partner_id: partnerId || undefined, per_page: 12, page }, controller.signal),
          superAdmin ? getPartners(accessToken, { status: "active", per_page: 100 }, controller.signal) : Promise.resolve(null),
          partnerId ? getEvents(accessToken, { partner_id: partnerId, per_page: 100 }, controller.signal) : Promise.resolve(null),
        ])
        if (controller.signal.aborted) return
        if (page > Math.max(1, galleriesResult.meta.last_page)) {
          updateQuery({ page: galleriesResult.meta.last_page > 1 ? String(galleriesResult.meta.last_page) : null })
          return
        }
        setResponse(galleriesResult)
        setPartners(partnersResult?.data ?? [])
        setEvents(eventsResult?.data ?? [])
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

    void loadGalleries()
    return () => controller.abort()
  }, [eventParam, handleForbidden, handleUnauthorized, page, partnerParam, retryKey, superAdmin, token, updateQuery])

  const filtered = Boolean(partnerParam)
  const selectedEventId = eventParam ? Number(eventParam) : null
  const partnerOptions = superAdmin
    ? partners
    : user?.partner
      ? [{ id: user.partner.id, company_name: user.partner.company_name, brand_name: user.partner.brand_name }]
      : []
  const eventGroups = [...new Set((response?.data ?? []).map((gallery) => gallery.event_id).filter((id): id is number => id !== null))]
  const visibleGalleries = selectedEventId ? (response?.data ?? []).filter((gallery) => gallery.event_id === selectedEventId) : []

  function openPartner(partnerId: number) {
    updateQuery({ partner_id: String(partnerId), page: null })
  }

  function openEvent(eventId: number) {
    updateQuery({ event_id: String(eventId), page: null })
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sesi foto yang sudah selesai beserta link Public Gallery untuk customer.</p>
        </div>
        <Button variant="outline" disabled={loadState === "loading"} onClick={() => setRetryKey((value) => value + 1)}>
          <RefreshCw aria-hidden="true" /> Muat ulang
        </Button>
      </header>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>{selectedEventId ? "Foto Event" : filtered ? "Pilih Event" : "Pilih Partner / Kiosk"}</CardTitle>
            <CardDescription>{selectedEventId ? "Sesi foto dari event yang dipilih." : filtered ? "Pilih event untuk melihat foto gallery." : "Pilih kiosk untuk melihat daftar event."}</CardDescription>
          </div>
          {superAdmin && (
            <div className="grid gap-3 sm:grid-cols-[16rem_auto]">
              <Select<string>
                value={partnerParam ?? "all"}
                onValueChange={(value) => value !== null && updateQuery({ partner_id: value === "all" ? null : value, page: null })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua partner</SelectItem>
                  {partners.map((partner) => <SelectItem key={partner.id} value={String(partner.id)}>{partner.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" disabled={!filtered} onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}>Reset</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loadState === "loading" && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>{[0, 1, 2].map((item) => <Skeleton key={item} className="h-40 rounded-xl" />)}</div>}

          {loadState === "success" && !filtered && (
            partnerOptions.length === 0 ? (
              <div className="grid min-h-64 place-items-center text-center"><div><Building2 className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-medium">Partner tidak tersedia</p></div></div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {partnerOptions.map((partner) => (
                  <Card key={partner.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => openPartner(partner.id)}>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-5" />{partner.brand_name || partner.company_name}</CardTitle><CardDescription>{partner.company_name}</CardDescription></CardHeader>
                    <CardContent><Button className="w-full" onClick={(event) => { event.stopPropagation(); openPartner(partner.id) }}><Images aria-hidden="true" /> Lihat Gallery</Button></CardContent>
                  </Card>
                ))}
              </div>
            )
          )}

          {loadState === "error" && (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <CircleAlert className="mx-auto size-10 text-destructive" />
                <p className="mt-3 font-medium">Daftar Gallery gagal dimuat</p>
                <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
                <Button className="mt-4" variant="outline" onClick={() => setRetryKey((value) => value + 1)}><RefreshCw aria-hidden="true" /> Coba lagi</Button>
              </div>
            </div>
          )}

          {loadState === "success" && filtered && !selectedEventId && (
            eventGroups.length === 0 ? (
              <div className="grid min-h-64 place-items-center text-center"><div><Images className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-medium">Belum ada Event Gallery</p></div></div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {eventGroups.map((eventId) => {
                  const event = events.find((item) => item.id === eventId)
                  const count = (response?.data ?? []).filter((gallery) => gallery.event_id === eventId).length
                  return <Card key={eventId} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => openEvent(eventId)}><CardHeader><CardTitle>{event?.event_name ?? `Event #${eventId}`}</CardTitle><CardDescription>{event?.event_code ?? "Event"}</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">{count} sesi gallery</p><Button className="mt-3 w-full" onClick={(clickEvent) => { clickEvent.stopPropagation(); openEvent(eventId) }}><Images aria-hidden="true" /> Lihat Foto</Button></CardContent></Card>
                })}
              </div>
            )
          )}

          {loadState === "success" && selectedEventId && response && visibleGalleries.length === 0 && (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <Images className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-3 font-medium">{filtered ? "Gallery tidak ditemukan" : "Belum ada Gallery"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{filtered ? "Ubah atau reset filter partner." : "Gallery muncul setelah sesi foto di kiosk selesai."}</p>
              </div>
            </div>
          )}

          {loadState === "success" && filtered && response && visibleGalleries.length > 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleGalleries.map((gallery) => <GalleryCard key={gallery.id} gallery={gallery} />)}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <p className="text-sm text-muted-foreground">{response.meta.from ?? 0}–{response.meta.to ?? 0} dari {response.meta.total} Gallery</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={response.meta.current_page <= 1} onClick={() => updateQuery({ page: response.meta.current_page - 1 === 1 ? null : String(response.meta.current_page - 1) })}><ChevronLeft aria-hidden="true" /> Sebelumnya</Button>
                  <Button size="sm" variant="outline" disabled={response.meta.current_page >= response.meta.last_page} onClick={() => updateQuery({ page: String(response.meta.current_page + 1) })}>Berikutnya <ChevronRight aria-hidden="true" /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Toaster position="top-right" />
    </div>
  )
}
