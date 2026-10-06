import {
  CircleAlert,
  Copy,
  Plus,
  Printer,
  RefreshCw,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"
import type { BoothRecord } from "@/features/booths/booth.types"
import { getPrinterProfiles } from "@/features/printer-profiles/printer-profile-service"
import type { PrinterProfileRecord } from "@/features/printer-profiles/printer-profile.types"
import { ApiError } from "@/lib/api-client"

import { PhysicalPrinterSection } from "./physical-printer-section"
import { PrinterProfileCard } from "./printer-profile-card"
import { PrinterProfileDeleteDialog } from "./printer-profile-delete-dialog"
import { PrinterProfileFormDialog } from "./printer-profile-form-dialog"

type LoadState = "loading" | "success" | "error"

interface FormState {
  readonly profile: PrinterProfileRecord | null
  readonly template: PrinterProfileRecord | null
}

export function PrinterProfileTab({
  booth,
  onUnauthorized,
  onForbidden,
}: {
  readonly booth: BoothRecord
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const [profiles, setProfiles] = useState<ReadonlyArray<PrinterProfileRecord>>([])
  const [globalProfiles, setGlobalProfiles] = useState<ReadonlyArray<PrinterProfileRecord>>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PrinterProfileRecord | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const refresh = useCallback(() => setRetryKey((value) => value + 1), [])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    const controller = new AbortController()

    async function loadProfiles() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const [partnerProfiles, globals] = await Promise.all([
          getPrinterProfiles(
            accessToken,
            { scope: "partner", partner_id: booth.partner.id, per_page: 100 },
            controller.signal
          ),
          getPrinterProfiles(
            accessToken,
            { scope: "global", per_page: 100 },
            controller.signal
          ),
        ])

        if (controller.signal.aborted) return
        setProfiles(partnerProfiles.data)
        setGlobalProfiles(globals.data)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized()
          return
        }
        if (error instanceof ApiError && error.status === 403) {
          onForbidden()
          return
        }
        setProfiles([])
        setGlobalProfiles([])
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server."
        )
        setLoadState("error")
      }
    }

    void loadProfiles()
    return () => controller.abort()
  }, [booth.partner.id, onForbidden, onUnauthorized, retryKey, token])

  return (
    <div className="space-y-4">
      <PhysicalPrinterSection booth={booth} onUnauthorized={onUnauthorized} onForbidden={onForbidden} />

      <div className="border-t pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold">Printer profiles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Profile Partner berlaku untuk seluruh Booth. Buat profile baru, atau
            duplikat dari profile Global.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={globalProfiles.length === 0}
            onClick={() => setPickerOpen(true)}
          >
            <Copy aria-hidden="true" /> Duplikat dari Global
          </Button>
          <Button onClick={() => setFormState({ profile: null, template: null })}>
            <Plus aria-hidden="true" /> Tambah printer profile
          </Button>
        </div>
      </div>

      {loadState === "loading" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-80 rounded-xl" />)}
        </div>
      )}

      {loadState === "error" && (
        <Card><CardContent className="grid min-h-56 place-items-center text-center"><div><CircleAlert className="mx-auto size-9 text-destructive" /><p className="mt-3 font-medium">Printer profile gagal dimuat</p><p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p><Button className="mt-4" variant="outline" onClick={refresh}><RefreshCw aria-hidden="true" /> Coba lagi</Button></div></CardContent></Card>
      )}

      {loadState === "success" && profiles.length === 0 && (
        <Card><CardContent className="grid min-h-56 place-items-center text-center"><div><Printer className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-medium">Belum ada printer profile</p><p className="mt-1 text-sm text-muted-foreground">Tambahkan konfigurasi printer pertama untuk Partner ini, atau duplikat dari profile Global.</p></div></CardContent></Card>
      )}

      {loadState === "success" && profiles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <PrinterProfileCard
              key={profile.id}
              profile={profile}
              onEdit={() => setFormState({ profile, template: null })}
              onDelete={() => setDeleteTarget(profile)}
            />
          ))}
        </div>
      )}

      <div className="rounded-lg border p-3 text-sm text-muted-foreground">
        <Printer className="mr-2 inline size-4" aria-hidden="true" />
        Printer profile dipilih ketika membuat Event; backend belum mengikatnya
        langsung ke satu Booth.
      </div>

      {formState && (
        <PrinterProfileFormDialog
          key={formState.profile?.id ?? formState.template?.id ?? "new-printer-profile"}
          partnerId={booth.partner.id}
          profile={formState.profile}
          template={formState.template}
          open
          onOpenChange={(open) => !open && setFormState(null)}
          onSaved={(profile, isNew) => {
            toast.success(isNew ? `Printer profile ${profile.printer_name} ditambahkan.` : `Printer profile ${profile.printer_name} diperbarui.`)
            refresh()
          }}
          onUnauthorized={onUnauthorized}
          onForbidden={onForbidden}
        />
      )}

      {deleteTarget && (
        <PrinterProfileDeleteDialog
          key={deleteTarget.id}
          profile={deleteTarget}
          open
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onDeleted={(profile) => {
            setDeleteTarget(null)
            toast.success(`Printer profile ${profile.printer_name} dihapus.`)
            refresh()
          }}
          onUnauthorized={onUnauthorized}
          onForbidden={onForbidden}
        />
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pilih profile Global</DialogTitle>
            <DialogDescription>
              Profile Global akan diduplikat menjadi profile Partner baru.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[60vh] gap-2 overflow-y-auto">
            {globalProfiles.map((global) => (
              <button
                key={global.id}
                type="button"
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                onClick={() => {
                  setPickerOpen(false)
                  setFormState({ profile: null, template: global })
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{global.printer_name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {global.paper_size} · {global.orientation} · {global.copies} salinan
                  </span>
                </span>
                <Copy className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
