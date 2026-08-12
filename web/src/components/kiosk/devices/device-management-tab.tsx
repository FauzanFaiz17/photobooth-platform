import { Copy, KeyRound, LoaderCircle, Monitor, Pencil, Plus, RefreshCw, RotateCcw, Trash2, TriangleAlert } from "lucide-react"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"
import type { BoothRecord } from "@/features/booths/booth.types"
import { createDevice, deleteDevice, getDevices, regenerateDeviceActivation, updateDevice } from "@/features/devices/device-service"
import type { DeviceActivationResult, DevicePresence, DeviceRecord, DeviceStatus } from "@/features/devices/device.types"
import { ApiError } from "@/lib/api-client"

const statusLabels: Record<DeviceStatus, string> = { pending: "Menunggu aktivasi", active: "Aktif", blocked: "Diblokir", revoked: "Dicabut" }
const presenceLabels: Record<DevicePresence, string> = { online: "Online", stale: "Stale", offline: "Offline" }

function formatDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"
}

function presenceVariant(presence: DevicePresence): "default" | "secondary" | "outline" {
  return presence === "online" ? "default" : presence === "stale" ? "secondary" : "outline"
}

function ActivationDialog({ result, onClose }: { readonly result: DeviceActivationResult; readonly onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(result.activation_code)
      setCopied(true)
      setCopyError(false)
    } catch {
      setCopyError(true)
    }
  }

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Kode aktivasi device</DialogTitle>
          <DialogDescription>Kode hanya ditampilkan sekarang dan berlaku sampai {formatDate(result.device.activation_expires_at)}.</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/40 p-4 text-center">
          <p className="font-mono text-2xl font-semibold tracking-wider">{result.activation_code}</p>
        </div>
        <p className="text-sm text-muted-foreground">Masukkan kode ini pada aplikasi desktop di device {result.device.device_name}.</p>
        {copyError && <p role="alert" className="text-sm text-destructive">Kode tidak dapat disalin otomatis. Salin kode secara manual.</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => void copyCode()}><Copy aria-hidden="true" /> {copied ? "Tersalin" : "Salin kode"}</Button>
          <Button onClick={onClose}>Saya sudah menyimpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeviceFormDialog({ booth, device, onClose, onSaved, onUnauthorized, onForbidden }: {
  readonly booth: BoothRecord
  readonly device: DeviceRecord | null
  readonly onClose: () => void
  readonly onSaved: (result: DeviceRecord | DeviceActivationResult, isNew: boolean) => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const [name, setName] = useState(device?.device_name ?? "")
  const [status, setStatus] = useState<DeviceStatus>(device?.status ?? "pending")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || pending) return
    if (!name.trim()) return setError("Nama device wajib diisi.")

    setPending(true)
    setError("")
    try {
      const result = device
        ? await updateDevice(token, device.id, { booth_id: booth.id, device_name: name.trim(), status })
        : await createDevice(token, { partner_id: booth.partner.id, booth_id: booth.id, device_name: name.trim() })
      onSaved(result, device === null)
      onClose()
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
      if (caught instanceof ApiError && caught.status === 403) return onForbidden()
      setError(caught instanceof ApiError ? caught.validationErrors.device_name?.[0] ?? caught.message : "Tidak dapat terhubung ke server.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{device ? "Edit device" : "Tambah device"}</DialogTitle><DialogDescription>{device ? `Perbarui device pada ${booth.name}.` : "Device baru akan menerima kode aktivasi sekali pakai."}</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void submit(event)} noValidate>
          <div className="grid gap-2"><Label htmlFor="device-name">Nama device</Label><Input id="device-name" value={name} maxLength={150} aria-invalid={Boolean(error)} onChange={(event) => { setName(event.target.value); setError("") }} /></div>
          {device && <div className="grid gap-2"><Label htmlFor="device-status">Status</Label><Select<DeviceStatus> value={status} onValueChange={(value) => value !== null && setStatus(value)}><SelectTrigger id="device-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Menunggu aktivasi</SelectItem><SelectItem value="active" disabled={device.status === "pending"}>Aktif</SelectItem><SelectItem value="blocked">Diblokir</SelectItem><SelectItem value="revoked">Dicabut</SelectItem></SelectContent></Select></div>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Batal</Button><Button type="submit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}{device ? "Simpan" : "Buat device"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmDialog({ device, action, onClose, onDone, onUnauthorized, onForbidden }: {
  readonly device: DeviceRecord
  readonly action: "regenerate" | "delete"
  readonly onClose: () => void
  readonly onDone: (result?: DeviceActivationResult) => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function confirm() {
    if (!token || pending) return
    setPending(true)
    setError("")
    try {
      const result = action === "regenerate" ? await regenerateDeviceActivation(token, device.id) : undefined
      if (action === "delete") await deleteDevice(token, device.id)
      onDone(result)
      onClose()
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
      if (caught instanceof ApiError && caught.status === 403) return onForbidden()
      setError(caught instanceof ApiError ? caught.message : "Tidak dapat terhubung ke server.")
    } finally {
      setPending(false)
    }
  }

  const regenerate = action === "regenerate"
  return (
    <AlertDialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogMedia className={regenerate ? "" : "bg-destructive/10 text-destructive"}>{regenerate ? <KeyRound aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}</AlertDialogMedia><AlertDialogTitle>{regenerate ? "Buat ulang kode aktivasi?" : "Hapus device?"}</AlertDialogTitle><AlertDialogDescription>{regenerate ? `Fingerprint ${device.device_name} akan dilepas dan status kembali menunggu aktivasi.` : `Device ${device.device_name} akan dihapus permanen dari daftar.`}</AlertDialogDescription></AlertDialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter><AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel><AlertDialogAction variant={regenerate ? "default" : "destructive"} disabled={pending} onClick={() => void confirm()}>{pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}{regenerate ? "Buat ulang" : "Hapus"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DeviceManagementTab({ booth, onUnauthorized, onForbidden }: { readonly booth: BoothRecord; readonly onUnauthorized: () => void; readonly onForbidden: () => void }) {
  const { token } = useAuth()
  const [devices, setDevices] = useState<ReadonlyArray<DeviceRecord>>([])
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  const [edit, setEdit] = useState<DeviceRecord | null | undefined>(undefined)
  const [confirm, setConfirm] = useState<{ device: DeviceRecord; action: "regenerate" | "delete" } | null>(null)
  const [activation, setActivation] = useState<DeviceActivationResult | null>(null)
  const refresh = useCallback(() => setRetry((value) => value + 1), [])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    const controller = new AbortController()
    async function load() {
      setLoadState("loading")
      try {
        const response = await getDevices(accessToken, { booth_id: booth.id, per_page: 100, sort: "device_name", direction: "asc" }, controller.signal)
        if (controller.signal.aborted) return
        setDevices(response.data)
        setLoadState("success")
      } catch (caught: unknown) {
        if (controller.signal.aborted) return
        if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
        if (caught instanceof ApiError && caught.status === 403) return onForbidden()
        setError(caught instanceof ApiError ? caught.message : "Tidak dapat terhubung ke server.")
        setLoadState("error")
      }
    }
    void load()
    return () => controller.abort()
  }, [booth.id, onForbidden, onUnauthorized, retry, token])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Device management</h2><p className="mt-1 text-sm text-muted-foreground">Kelola perangkat desktop dan pantau heartbeat Booth ini.</p></div><Button disabled={booth.status !== "active"} onClick={() => setEdit(null)}><Plus aria-hidden="true" /> Tambah device</Button></div>
      {booth.status !== "active" && <p className="text-sm text-muted-foreground">Booth harus aktif sebelum device baru dapat dibuat atau diaktifkan ulang.</p>}
      {loadState === "loading" && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>{[0, 1, 2].map((item) => <Skeleton key={item} className="h-72 rounded-xl" />)}</div>}
      {loadState === "error" && <Card><CardContent className="grid min-h-56 place-items-center text-center"><div><TriangleAlert className="mx-auto size-9 text-destructive" /><p className="mt-3 font-medium">Device gagal dimuat</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={refresh}><RefreshCw aria-hidden="true" /> Coba lagi</Button></div></CardContent></Card>}
      {loadState === "success" && devices.length === 0 && <Card><CardContent className="grid min-h-56 place-items-center text-center"><div><Monitor className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-medium">Belum ada device</p><p className="mt-1 text-sm text-muted-foreground">Tambahkan perangkat desktop pertama untuk Booth ini.</p></div></CardContent></Card>}
      {loadState === "success" && devices.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{devices.map((device) => <Card key={device.id}><CardHeader className="border-b"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate">{device.device_name}</CardTitle><CardDescription className="mt-1 font-mono">{device.device_key}</CardDescription></div><div className="flex flex-wrap justify-end gap-1"><Badge variant={presenceVariant(device.presence_status)}>{presenceLabels[device.presence_status]}</Badge><Badge variant="outline">{statusLabels[device.status]}</Badge></div></div></CardHeader><CardContent><dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-xs text-muted-foreground">Versi aplikasi</dt><dd className="mt-1 font-medium">{device.app_version || "—"}</dd></div><div><dt className="text-xs text-muted-foreground">UUID</dt><dd className="mt-1 truncate font-mono" title={device.device_uuid || undefined}>{device.device_uuid || "Belum aktif"}</dd></div><div><dt className="text-xs text-muted-foreground">Heartbeat</dt><dd className="mt-1 font-medium">{formatDate(device.last_sync_at)}</dd></div><div><dt className="text-xs text-muted-foreground">Login terakhir</dt><dd className="mt-1 font-medium">{formatDate(device.last_login_at)}</dd></div></dl></CardContent><CardFooter className="flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setEdit(device)}><Pencil aria-hidden="true" /> Edit</Button><Button size="sm" variant="outline" disabled={booth.status !== "active"} onClick={() => setConfirm({ device, action: "regenerate" })}><RotateCcw aria-hidden="true" /> Aktivasi ulang</Button><Button size="sm" variant="destructive" onClick={() => setConfirm({ device, action: "delete" })}><Trash2 aria-hidden="true" /> Hapus</Button></CardFooter></Card>)}</div>}
      {edit !== undefined && <DeviceFormDialog booth={booth} device={edit} onClose={() => setEdit(undefined)} onSaved={(result, isNew) => { if (isNew && "activation_code" in result) setActivation(result); toast.success(isNew ? "Device dibuat." : "Device diperbarui."); refresh() }} onUnauthorized={onUnauthorized} onForbidden={onForbidden} />}
      {confirm && <ConfirmDialog device={confirm.device} action={confirm.action} onClose={() => setConfirm(null)} onDone={(result) => { if (result) setActivation(result); toast.success(result ? "Kode aktivasi baru dibuat." : "Device dihapus."); refresh() }} onUnauthorized={onUnauthorized} onForbidden={onForbidden} />}
      {activation && <ActivationDialog result={activation} onClose={() => setActivation(null)} />}
    </div>
  )
}
