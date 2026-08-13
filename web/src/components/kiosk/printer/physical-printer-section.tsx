import { CircleAlert, LoaderCircle, Pencil, Plus, Power, Printer, RefreshCw, Trash2, TriangleAlert } from "lucide-react"
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/features/auth/auth-context"
import type { BoothRecord } from "@/features/booths/booth.types"
import { getDevices } from "@/features/devices/device-service"
import type { DeviceRecord } from "@/features/devices/device.types"
import { createPrinter, deletePrinter, getPrinters, updatePrinter } from "@/features/printers/printer-service"
import type { PrinterInput, PrinterRecord } from "@/features/printers/printer.types"
import { ApiError } from "@/lib/api-client"

function inputFor(printer: PrinterRecord, active = printer.is_active): PrinterInput {
  return { booth_id: printer.booth_id, device_id: printer.device_id, name: printer.name, driver_name: printer.driver_name, is_active: active }
}

function PrinterForm({ booth, devices, printer, onClose, onSaved, onUnauthorized, onForbidden }: {
  readonly booth: BoothRecord
  readonly devices: ReadonlyArray<DeviceRecord>
  readonly printer: PrinterRecord | null
  readonly onClose: () => void
  readonly onSaved: (printer: PrinterRecord, isNew: boolean) => void
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const [name, setName] = useState(printer?.name ?? "")
  const [driver, setDriver] = useState(printer?.driver_name ?? "")
  const [deviceId, setDeviceId] = useState(printer?.device_id ? String(printer.device_id) : "none")
  const [active, setActive] = useState(printer?.is_active ?? true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!token || pending) return
    if (!name.trim()) return setError("Nama printer wajib diisi.")
    setPending(true)
    setError("")
    const input: PrinterInput = { booth_id: booth.id, device_id: deviceId === "none" ? null : Number(deviceId), name: name.trim(), driver_name: driver.trim() || null, is_active: active }
    try {
      const saved = printer ? await updatePrinter(token, printer.id, input) : await createPrinter(token, { ...input, partner_id: booth.partner.id })
      onSaved(saved, printer === null)
      onClose()
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
      if (caught instanceof ApiError && caught.status === 403) return onForbidden()
      setError(caught instanceof ApiError ? caught.validationErrors.name?.[0] ?? caught.validationErrors.device_id?.[0] ?? caught.message : "Tidak dapat terhubung ke server.")
    } finally {
      setPending(false)
    }
  }

  return <Dialog open onOpenChange={(open) => !open && !pending && onClose()}><DialogContent><DialogHeader><DialogTitle>{printer ? "Edit printer fisik" : "Tambah printer fisik"}</DialogTitle><DialogDescription>Printer akan digunakan oleh Booth {booth.name}.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={(event) => void submit(event)}><div className="grid gap-2"><Label htmlFor="physical-printer-name">Nama printer</Label><Input id="physical-printer-name" required maxLength={150} value={name} onChange={(event) => { setName(event.target.value); setError("") }} /></div><div className="grid gap-2"><Label htmlFor="physical-printer-driver">Driver</Label><Input id="physical-printer-driver" maxLength={150} value={driver} placeholder="Contoh: DNP DS-RX1" onChange={(event) => setDriver(event.target.value)} /></div><div className="grid gap-2"><Label htmlFor="physical-printer-device">Device</Label><Select value={deviceId} onValueChange={(value) => value !== null && setDeviceId(value)}><SelectTrigger id="physical-printer-device" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Tanpa Device</SelectItem>{devices.map((device) => <SelectItem key={device.id} value={String(device.id)}>{device.device_name}</SelectItem>)}</SelectContent></Select></div><label className="flex items-center justify-between rounded-md border p-3 text-sm">Printer aktif<Switch checked={active} onCheckedChange={setActive} /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Batal</Button><Button type="submit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}{printer ? "Simpan" : "Tambah printer"}</Button></DialogFooter></form></DialogContent></Dialog>
}

function DeleteDialog({ printer, onClose, onDeleted, onUnauthorized, onForbidden }: { readonly printer: PrinterRecord; readonly onClose: () => void; readonly onDeleted: () => void; readonly onUnauthorized: () => void; readonly onForbidden: () => void }) {
  const { token } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  async function remove(): Promise<void> {
    if (!token || pending) return
    setPending(true)
    setError("")
    try {
      await deletePrinter(token, printer.id)
      onDeleted()
      onClose()
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
      if (caught instanceof ApiError && caught.status === 403) return onForbidden()
      setError(caught instanceof ApiError && caught.status === 409 ? "Printer sudah memiliki riwayat cetak dan tidak dapat dihapus. Nonaktifkan printer dari kartunya." : caught instanceof ApiError ? caught.message : "Tidak dapat terhubung ke server.")
    } finally {
      setPending(false)
    }
  }
  return <AlertDialog open onOpenChange={(open) => !open && !pending && onClose()}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia className="bg-destructive/10 text-destructive"><TriangleAlert aria-hidden="true" /></AlertDialogMedia><AlertDialogTitle>Hapus printer fisik?</AlertDialogTitle><AlertDialogDescription>Printer {printer.name} akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={pending || Boolean(error)} onClick={() => void remove()}>{pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}Hapus printer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}

export function PhysicalPrinterSection({ booth, onUnauthorized, onForbidden }: { readonly booth: BoothRecord; readonly onUnauthorized: () => void; readonly onForbidden: () => void }) {
  const { token } = useAuth()
  const [printers, setPrinters] = useState<ReadonlyArray<PrinterRecord>>([])
  const [devices, setDevices] = useState<ReadonlyArray<DeviceRecord>>([])
  const [state, setState] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  const [form, setForm] = useState<PrinterRecord | null | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<PrinterRecord | null>(null)
  const deviceNames = useMemo(() => new Map(devices.map((device) => [device.id, device.device_name])), [devices])
  const refresh = useCallback(() => setRetry((value) => value + 1), [])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    const controller = new AbortController()
    async function load(): Promise<void> {
      setState("loading")
      setError("")
      try {
        const [printerResult, deviceResult] = await Promise.all([getPrinters(accessToken, { booth_id: booth.id, per_page: 100 }, controller.signal), getDevices(accessToken, { booth_id: booth.id, per_page: 100 }, controller.signal)])
        if (controller.signal.aborted) return
        setPrinters(printerResult.data)
        setDevices(deviceResult.data)
        setState("success")
      } catch (caught: unknown) {
        if (controller.signal.aborted) return
        if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
        if (caught instanceof ApiError && caught.status === 403) return onForbidden()
        setError(caught instanceof ApiError ? caught.message : "Tidak dapat terhubung ke server.")
        setState("error")
      }
    }
    void load()
    return () => controller.abort()
  }, [booth.id, onForbidden, onUnauthorized, retry, token])

  async function toggle(printer: PrinterRecord): Promise<void> {
    if (!token) return
    try {
      await updatePrinter(token, printer.id, inputFor(printer, !printer.is_active))
      toast.success(`Printer ${printer.name} ${printer.is_active ? "dinonaktifkan" : "diaktifkan"}.`)
      refresh()
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) return onUnauthorized()
      if (caught instanceof ApiError && caught.status === 403) return onForbidden()
      toast.error(caught instanceof ApiError ? caught.message : "Tidak dapat terhubung ke server.")
    }
  }

  return <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Printer fisik Booth</h2><p className="mt-1 text-sm text-muted-foreground">Kelola printer yang terhubung ke Booth dan Device.</p></div><Button onClick={() => setForm(null)}><Plus aria-hidden="true" /> Tambah printer</Button></div>{state === "loading" && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>{[0, 1, 2].map((item) => <Skeleton key={item} className="h-64" />)}</div>}{state === "error" && <Card><CardContent className="grid min-h-56 place-items-center text-center"><div><CircleAlert className="mx-auto size-9 text-destructive" /><p className="mt-3 font-medium">Printer fisik gagal dimuat</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={refresh}><RefreshCw aria-hidden="true" /> Coba lagi</Button></div></CardContent></Card>}{state === "success" && printers.length === 0 && <Card><CardContent className="grid min-h-56 place-items-center text-center"><div><Printer className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-medium">Belum ada printer fisik</p><p className="mt-1 text-sm text-muted-foreground">Tambahkan printer pertama untuk Booth ini.</p></div></CardContent></Card>}{state === "success" && printers.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{printers.map((printer) => <Card key={printer.id}><CardHeader className="border-b"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate">{printer.name}</CardTitle><CardDescription className="mt-1">{printer.driver_name || "Driver tidak diisi"}</CardDescription></div><Badge variant={printer.is_active ? "default" : "secondary"}>{printer.is_active ? "Aktif" : "Nonaktif"}</Badge></div></CardHeader><CardContent><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Booth</dt><dd className="mt-1 font-medium">{booth.name}</dd></div><div><dt className="text-xs text-muted-foreground">Device</dt><dd className="mt-1 font-medium">{printer.device_id ? deviceNames.get(printer.device_id) ?? `Device #${printer.device_id}` : "Tanpa Device"}</dd></div></dl></CardContent><CardFooter className="flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setForm(printer)}><Pencil aria-hidden="true" /> Edit</Button><Button size="sm" variant="outline" onClick={() => void toggle(printer)}><Power aria-hidden="true" /> {printer.is_active ? "Nonaktifkan" : "Aktifkan"}</Button><Button size="sm" variant="destructive" onClick={() => setDeleteTarget(printer)}><Trash2 aria-hidden="true" /> Hapus</Button></CardFooter></Card>)}</div>}{form !== undefined && <PrinterForm booth={booth} devices={devices} printer={form} onClose={() => setForm(undefined)} onSaved={(saved, isNew) => { toast.success(isNew ? `Printer ${saved.name} ditambahkan.` : `Printer ${saved.name} diperbarui.`); refresh() }} onUnauthorized={onUnauthorized} onForbidden={onForbidden} />}{deleteTarget && <DeleteDialog printer={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={() => { toast.success(`Printer ${deleteTarget.name} dihapus.`); refresh() }} onUnauthorized={onUnauthorized} onForbidden={onForbidden} />}</section>
}
