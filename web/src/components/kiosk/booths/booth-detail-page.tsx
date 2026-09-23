import {
  ArrowLeft,
  CircleAlert,
  LoaderCircle,
  Mail,
  MapPin,
  Monitor,
  Printer,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

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
import { Input } from "@/components/ui/input"
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
import { getPrinters } from "@/features/printers/printer-service"
import type { PrinterRecord } from "@/features/printers/printer.types"
import {
  getPrinterAlert,
  saveAlertSetting,
  addRecipient,
  removeRecipient,
} from "@/features/printers/printer-alert-service"
import type {
  PrinterAlertSettingRecord,
  PrinterAlertSummary,
} from "@/features/printers/printer-alert.types"
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

function PaperAlertSection({
  printer,
  alertData,
  onSaved,
  onUnauthorized,
  onForbidden,
}: {
  readonly printer: PrinterRecord
  readonly alertData: {
    setting: PrinterAlertSettingRecord | null
    summary: PrinterAlertSummary
  }
  readonly onSaved: (
    setting: PrinterAlertSettingRecord | null,
    summary: PrinterAlertSummary,
  ) => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const { setting, summary } = alertData
  const [resetValue, setResetValue] = useState("")
  const [thresholdValue, setThresholdValue] = useState(
    String(setting?.low_stock_threshold ?? summary.low_stock_threshold ?? 15),
  )
  const [recipientEmail, setRecipientEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  const totalLimit = setting?.total_print_limit ?? summary.total_print_limit ?? 0
  const remaining = summary.remaining_prints
  const lowThreshold = setting?.low_stock_threshold ?? summary.low_stock_threshold ?? 15
  const lastSetAt = setting?.created_at ?? null
  const recipients = setting?.recipients ?? []

  function formatDateShort(value: string): string {
    const d = new Date(value)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const h = String(d.getHours()).padStart(2, "0")
    const min = String(d.getMinutes()).padStart(2, "0")
    return `${y}-${m}-${day} ${h}:${min}`
  }

  async function handleReset(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!token || pending) return
    const val = Number(resetValue)
    const threshold = Number(thresholdValue)
    if (resetValue.trim() && (!Number.isInteger(val) || val < 1)) {
      setError("Masukkan angka bulat minimal 1 untuk jumlah kertas.")
      return
    }
    if (!Number.isInteger(threshold) || threshold < 0) {
      setError("Minimal stok harus angka bulat ≥ 0.")
      return
    }
    setPending(true)
    setError("")
    try {
      const result = await saveAlertSetting(token, printer.id, {
        total_print_limit: resetValue.trim() ? val : (setting?.total_print_limit ?? summary.total_print_limit ?? 1),
        low_stock_threshold: threshold,
        is_active: setting?.is_active ?? true,
      })
      setResetValue("")
      onSaved(result.alert_setting, result.summary)
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
      if (caught instanceof ApiError && caught.status === 403) return onForbidden()
      setError(caught instanceof ApiError ? caught.message : "Gagal menyimpan.")
    } finally {
      setPending(false)
    }
  }

  async function handleSaveThreshold(): Promise<void> {
    if (!token || pending) return
    const threshold = Number(thresholdValue)
    if (!Number.isInteger(threshold) || threshold < 0) {
      setError("Minimal stok harus angka bulat ≥ 0.")
      return
    }
    setPending(true)
    setError("")
    try {
      const result = await saveAlertSetting(token, printer.id, {
        total_print_limit: setting?.total_print_limit ?? summary.total_print_limit ?? 1,
        low_stock_threshold: threshold,
        is_active: setting?.is_active ?? true,
      })
      onSaved(result.alert_setting, result.summary)
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
      if (caught instanceof ApiError && caught.status === 403) return onForbidden()
      setError(caught instanceof ApiError ? caught.message : "Gagal menyimpan.")
    } finally {
      setPending(false)
    }
  }

  async function handleAddRecipient(): Promise<void> {
    if (!token || pending || !recipientEmail.trim()) return
    setPending(true)
    setError("")
    try {
      const result = await addRecipient(token, printer.id, {
        email: recipientEmail.trim(),
      })
      setRecipientEmail("")
      onSaved(result.alert_setting, result.summary)
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
      if (caught instanceof ApiError && caught.status === 403) return onForbidden()
      setError(caught instanceof ApiError ? caught.message : "Gagal menambah email.")
    } finally {
      setPending(false)
    }
  }

  async function handleRemoveRecipient(recipientId: number): Promise<void> {
    if (!token || pending) return
    setPending(true)
    setError("")
    try {
      const result = await removeRecipient(token, printer.id, recipientId)
      onSaved(result.alert_setting, result.summary)
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
      if (caught instanceof ApiError && caught.status === 403) return onForbidden()
      setError(caught instanceof ApiError ? caught.message : "Gagal menghapus.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Printer className="size-5 text-muted-foreground" />
          <CardTitle>Kertas — {printer.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Status bar */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Awal
            </p>
            <p className="mt-1 text-2xl font-semibold">{totalLimit}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sisa
            </p>
            <p className="mt-1 text-2xl font-semibold text-green-600">
              {remaining ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Diset Pada
            </p>
            <p className="mt-1 text-sm font-medium">
              {lastSetAt ? formatDateShort(lastSetAt) : "—"}
            </p>
          </div>
        </div>

        {/* Reset form */}
        <div>
          <p className="mb-2 text-sm font-medium">Init / Reset jumlah kertas</p>
          <form className="flex gap-2" onSubmit={(e) => void handleReset(e)}>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 400"
              value={resetValue}
              onChange={(e) => {
                setResetValue(e.target.value)
                setError("")
              }}
              className="flex-1"
            />
            <Button type="submit" disabled={pending || !resetValue.trim()}>
              {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              Atur
            </Button>
          </form>
        </div>

        {/* Low stock threshold */}
        <div>
          <div className="mb-2">
            <p className="text-sm font-medium">
              Notifikasi saat sisa kertas ≤{" "}
              <span className="font-semibold text-amber-600">{lowThreshold}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Email dikirim ke penerima di bawah ketika sisa cetak mencapai batas
              ini (cooldown default 60 menit).
            </p>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void handleSaveThreshold()
            }}
          >
            <Input
              type="number"
              min={0}
              placeholder="e.g. 15"
              value={thresholdValue}
              onChange={(e) => {
                setThresholdValue(e.target.value)
                setError("")
              }}
              className="flex-1"
            />
            <Button type="submit" disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              Simpan Ambang
            </Button>
          </form>
        </div>

        {/* Email recipients */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div>
            <p className="font-medium">Kirim reminder kertas habis ke</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pemilik kiosk otomatis menerima notifikasi. Tambahkan orang yang
              mengisi ulang kertas agar menerima notifikasi yang sama.
            </p>
          </div>

          {recipients.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-sm">{r.email}</span>
                <Badge variant="secondary" className="text-xs">
                  Pemilik
                </Badge>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={pending}
                onClick={() => void handleRemoveRecipient(r.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Tambah email lain"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="default"
              disabled={pending || !recipientEmail.trim()}
              onClick={() => void handleAddRecipient()}
            >
              + Tambah
            </Button>
          </div>
        </div>

        {/* Send email now */}
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            className="text-sm font-medium"
            disabled={pending || recipients.length === 0}
            onClick={() => {
              toast.info("Fitur kirim email status kertas segera tersedia.")
            }}
          >
            <Send className="mr-2 size-4" />
            Kirim email status kertas sekarang
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Memakai daftar penerima yang tersimpan. Simpan halaman dulu jika
            email di atas baru diubah.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function BoothInfo({
  booth,
  printers,
  alertMap,
  onAlertSaved,
  onUnauthorized,
  onForbidden,
}: {
  readonly booth: BoothRecord
  readonly printers: ReadonlyArray<PrinterRecord>
  readonly alertMap: Map<
    number,
    { setting: PrinterAlertSettingRecord | null; summary: PrinterAlertSummary }
  >
  readonly onAlertSaved: (
    printerId: number,
    setting: PrinterAlertSettingRecord | null,
    summary: PrinterAlertSummary,
  ) => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  return (
    <div className="space-y-4">
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

      {printers.map((printer) => {
        const alertData = alertMap.get(printer.id)
        if (!alertData) return null
        return (
          <PaperAlertSection
            key={printer.id}
            printer={printer}
            alertData={alertData}
            onSaved={(setting, summary) =>
              onAlertSaved(printer.id, setting, summary)
            }
            onUnauthorized={onUnauthorized}
            onForbidden={onForbidden}
          />
        )
      })}
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
  const [printers, setPrinters] = useState<ReadonlyArray<PrinterRecord>>([])
  const [alertMap, setAlertMap] = useState<
    Map<
      number,
      { setting: PrinterAlertSettingRecord | null; summary: PrinterAlertSummary }
    >
  >(new Map())
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

  useEffect(() => {
    if (!token || loadState !== "success" || boothId === null) return
    const accessToken = token
    const controller = new AbortController()

    async function loadPrintersAndAlerts() {
      try {
        const result = await getPrinters(
          accessToken,
          { booth_id: boothId!, per_page: 100 },
          controller.signal,
        )
        if (controller.signal.aborted) return
        setPrinters(result.data)

        const entries = await Promise.all(
          result.data.map(async (printer) => {
            try {
              const alertResult = await getPrinterAlert(
                accessToken,
                printer.id,
                controller.signal,
              )
              return [
                printer.id,
                {
                  setting: alertResult.alert_setting,
                  summary: alertResult.summary,
                },
              ] as const
            } catch {
              return [
                printer.id,
                {
                  setting: null,
                  summary: {
                    is_configured: false,
                    remaining_prints: null,
                    total_print_limit: null,
                    low_stock_threshold: null,
                    is_alert: false,
                    recipients_count: 0,
                    last_notified_at: null,
                  },
                },
              ] as const
            }
          }),
        )
        if (controller.signal.aborted) return
        setAlertMap(new Map(entries))
      } catch {
        // ignore - alert is optional
      }
    }

    void loadPrintersAndAlerts()
    return () => controller.abort()
  }, [boothId, loadState, token])

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
              <BoothInfo
                booth={booth}
                printers={printers}
                alertMap={alertMap}
                onAlertSaved={(printerId, setting, summary) => {
                  setAlertMap((prev) => {
                    const next = new Map(prev)
                    next.set(printerId, { setting, summary })
                    return next
                  })
                  toast.success("Pengaturan alert disimpan.")
                }}
                onUnauthorized={() => void handleUnauthorized()}
                onForbidden={handleForbidden}
              />
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
                booth={booth}
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
