import {
  Aperture,
  Camera,
  CircleAlert,
  Copy,
  Plus,
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
import { getCameraProfiles } from "@/features/camera-profiles/camera-profile-service"
import type { CameraProfileRecord } from "@/features/camera-profiles/camera-profile.types"
import { ApiError } from "@/lib/api-client"

import { CameraProfileCard } from "./camera-profile-card"
import { CameraProfileDeleteDialog } from "./camera-profile-delete-dialog"
import { CameraProfileFormDialog } from "./camera-profile-form-dialog"

type LoadState = "loading" | "success" | "error"

interface FormState {
  readonly profile: CameraProfileRecord | null
  readonly template: CameraProfileRecord | null
}

export function CameraProfileTab({
  partnerId,
  onUnauthorized,
  onForbidden,
}: {
  readonly partnerId: number
  readonly onUnauthorized: () => void
  readonly onForbidden: () => void
}) {
  const { token } = useAuth()
  const [profiles, setProfiles] = useState<ReadonlyArray<CameraProfileRecord>>([])
  const [globalProfiles, setGlobalProfiles] = useState<ReadonlyArray<CameraProfileRecord>>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CameraProfileRecord | null>(null)
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
          getCameraProfiles(
            accessToken,
            { scope: "partner", partner_id: partnerId, per_page: 100 },
            controller.signal
          ),
          getCameraProfiles(
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
  }, [onForbidden, onUnauthorized, partnerId, retryKey, token])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Camera profiles</h2>
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
            <Plus aria-hidden="true" /> Tambah camera profile
          </Button>
        </div>
      </div>

      {loadState === "loading" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-80 rounded-xl" />)}
        </div>
      )}

      {loadState === "error" && (
        <Card><CardContent className="grid min-h-56 place-items-center text-center"><div><CircleAlert className="mx-auto size-9 text-destructive" /><p className="mt-3 font-medium">Camera profile gagal dimuat</p><p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p><Button className="mt-4" variant="outline" onClick={refresh}><RefreshCw aria-hidden="true" /> Coba lagi</Button></div></CardContent></Card>
      )}

      {loadState === "success" && profiles.length === 0 && (
        <Card><CardContent className="grid min-h-56 place-items-center text-center"><div><Camera className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-medium">Belum ada camera profile</p><p className="mt-1 text-sm text-muted-foreground">Tambahkan konfigurasi kamera pertama untuk Partner ini, atau duplikat dari profile Global.</p></div></CardContent></Card>
      )}

      {loadState === "success" && profiles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <CameraProfileCard
              key={profile.id}
              profile={profile}
              onEdit={() => setFormState({ profile, template: null })}
              onDelete={() => setDeleteTarget(profile)}
            />
          ))}
        </div>
      )}

      <div className="rounded-lg border p-3 text-sm text-muted-foreground">
        <Aperture className="mr-2 inline size-4" aria-hidden="true" />
        Camera profile dipilih ketika membuat Event; backend belum mengikatnya
        langsung ke satu Booth.
      </div>

      {formState && (
        <CameraProfileFormDialog
          key={formState.profile?.id ?? formState.template?.id ?? "new-camera-profile"}
          partnerId={partnerId}
          profile={formState.profile}
          template={formState.template}
          open
          onOpenChange={(open) => !open && setFormState(null)}
          onSaved={(profile, isNew) => {
            toast.success(isNew ? `Camera profile ${profile.name} ditambahkan.` : `Camera profile ${profile.name} diperbarui.`)
            refresh()
          }}
          onUnauthorized={onUnauthorized}
        />
      )}

      {deleteTarget && (
        <CameraProfileDeleteDialog
          key={deleteTarget.id}
          profile={deleteTarget}
          open
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onDeleted={(profile) => {
            setDeleteTarget(null)
            toast.success(`Camera profile ${profile.name} dihapus.`)
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
                  <span className="block truncate font-medium">{global.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    ISO {global.iso || "—"} · shutter {global.shutter_speed || "—"} · aperture {global.aperture || "—"}
                  </span>
                </span>
                <Copy className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
