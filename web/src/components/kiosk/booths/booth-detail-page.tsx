import {
  ArrowLeft,
  CircleAlert,
  MapPin,
  Monitor,
  RefreshCw,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"

import { CameraProfileTab } from "@/components/kiosk/camera/camera-profile-tab"
import { DeviceManagementTab } from "@/components/kiosk/devices/device-management-tab"
import { FilterTab } from "@/components/kiosk/filter/filter-tab"
import { PrinterProfileTab } from "@/components/kiosk/printer/printer-profile-tab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useAuth } from "@/features/auth/auth-context"
import { getBooth } from "@/features/booths/booth-service"
import type {
  BoothRecord,
  BoothStatus,
} from "@/features/booths/booth.types"
import { ApiError } from "@/lib/api-client"

type LoadState = "loading" | "success" | "not-found" | "error"

const statusLabels: Record<BoothStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  inactive: "Inactive",
}

function parseId(value: string | undefined): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function BoothInfo({ booth }: { readonly booth: BoothRecord }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Informasi booth</CardTitle>
              <CardDescription>Data unit fisik dari backend.</CardDescription>
            </div>
            <Badge
              variant={booth.status === "active" ? "default" : "secondary"}
            >
              {statusLabels[booth.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Nama Booth</dt><dd className="mt-1 font-medium">{booth.name}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Booth ID</dt><dd className="mt-1 font-mono">#{booth.id}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Lokasi</dt><dd className="mt-1 font-medium">{booth.location || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Device</dt><dd className="mt-1 font-medium">{booth.devices_count ?? 0} terdaftar</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partner/Kiosk</CardTitle>
          <CardDescription>Pemilik Booth ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Monitor className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
            <div><p className="font-medium">{booth.partner.brand_name || booth.partner.company_name}</p><p className="text-sm text-muted-foreground">{booth.partner.company_name}</p></div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Lokasi operasional: {booth.location || "belum diisi"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function BoothDetailPage() {
  const { partnerId: partnerParam, boothId: boothParam } = useParams<{
    partnerId: string
    boothId: string
  }>()
  const partnerId = parseId(partnerParam)
  const boothId = parseId(boothParam)
  const location = useLocation()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const [booth, setBooth] = useState<BoothRecord | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const returnTo = partnerId ? `/admin/kiosk/${partnerId}` : "/admin/kiosk"

  const handleUnauthorized = useCallback(async () => {
    await logout()
    navigate("/login", { replace: true, state: { from: location } })
  }, [location, logout, navigate])

  const handleForbidden = useCallback(() => {
    navigate("/admin/forbidden", {
      replace: true,
      state: { from: location.pathname },
    })
  }, [location.pathname, navigate])

  useEffect(() => {
    if (!token || boothId === null) return
    const accessToken = token
    const requestedBoothId = boothId
    const controller = new AbortController()

    async function loadBooth() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const response = await getBooth(
          accessToken,
          requestedBoothId,
          controller.signal
        )
        if (controller.signal.aborted) return

        if (partnerId !== null && response.partner.id !== partnerId) {
          setLoadState("not-found")
          return
        }

        setBooth(response)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          await handleUnauthorized()
          return
        }
        if (error instanceof ApiError && error.status === 403) {
          handleForbidden()
          return
        }
        if (error instanceof ApiError && error.status === 404) {
          setLoadState("not-found")
          return
        }
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server."
        )
        setLoadState("error")
      }
    }

    void loadBooth()
    return () => controller.abort()
  }, [boothId, handleForbidden, handleUnauthorized, partnerId, retryKey, token])

  if (partnerId === null || boothId === null) {
    return <div className="p-6"><p>Alamat detail Booth tidak valid.</p></div>
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      {loadState === "loading" && <div className="space-y-5" aria-busy><Skeleton className="h-9 w-40" /><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full rounded-xl" /></div>}

      {loadState === "not-found" && <Card><CardContent className="grid min-h-72 place-items-center text-center"><div><Monitor className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-4 text-xl font-semibold">Booth tidak ditemukan</h1><Button className="mt-5" variant="outline" render={<Link to={returnTo} />}><ArrowLeft aria-hidden="true" /> Kembali</Button></div></CardContent></Card>}

      {loadState === "error" && <Card><CardContent className="grid min-h-72 place-items-center text-center"><div><CircleAlert className="mx-auto size-10 text-destructive" /><h1 className="mt-4 text-xl font-semibold">Detail Booth gagal dimuat</h1><p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p><Button className="mt-5" onClick={() => setRetryKey((value) => value + 1)}><RefreshCw aria-hidden="true" /> Coba lagi</Button></div></CardContent></Card>}

      {loadState === "success" && booth && (
        <>
          <header className="space-y-5">
            <Button variant="ghost" className="-ml-2" render={<Link to={returnTo} />}>
              <ArrowLeft aria-hidden="true" /> Daftar Booth
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">{booth.partner.company_name}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{booth.name}</h1>
            </div>
          </header>

          <Tabs defaultValue="info">
            <div className="overflow-x-auto pb-1">
              <TabsList className="min-w-max" aria-label="Detail Booth">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="device">Device</TabsTrigger>
                <TabsTrigger value="camera">Kamera</TabsTrigger>
                <TabsTrigger value="filter">Filter</TabsTrigger>
                <TabsTrigger value="printer">Printer</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="info" className="pt-4">
              <BoothInfo booth={booth} />
            </TabsContent>
            <TabsContent value="device" className="pt-4">
              <DeviceManagementTab booth={booth} onUnauthorized={() => void handleUnauthorized()} onForbidden={handleForbidden} />
            </TabsContent>
            <TabsContent value="camera" className="pt-4">
              <CameraProfileTab
                partnerId={booth.partner.id}
                onUnauthorized={() => void handleUnauthorized()}
                onForbidden={handleForbidden}
              />
            </TabsContent>
            <TabsContent value="filter" className="pt-4">
              <FilterTab
                partnerId={booth.partner.id}
                onUnauthorized={() => void handleUnauthorized()}
                onForbidden={handleForbidden}
              />
            </TabsContent>
            <TabsContent value="printer" className="pt-4">
              <PrinterProfileTab
                partnerId={booth.partner.id}
                onUnauthorized={() => void handleUnauthorized()}
                onForbidden={handleForbidden}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      <Toaster position="top-right" />
    </div>
  )
}
