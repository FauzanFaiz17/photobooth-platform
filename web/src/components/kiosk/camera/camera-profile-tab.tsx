import {
  Aperture,
  Camera,
  CircleAlert,
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
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CameraProfileRecord | null>(null)

  const refresh = useCallback(() => setRetryKey((value) => value + 1), [])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    const controller = new AbortController()

    async function loadProfiles() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const result = await getCameraProfiles(
          accessToken,
          { scope: "partner", partner_id: partnerId, per_page: 100 },
          controller.signal
        )

        if (controller.signal.aborted) return
        setProfiles(result.data)
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
            Profile Partner berlaku untuk seluruh Booth. Profile Global
            dikelola di Settings → Global Config.
          </p>
        </div>
        <Button onClick={() => setFormState({ profile: null })}>
          <Plus aria-hidden="true" /> Tambah camera profile
        </Button>
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
        <Card><CardContent className="grid min-h-56 place-items-center text-center"><div><Camera className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-medium">Belum ada camera profile</p><p className="mt-1 text-sm text-muted-foreground">Tambahkan konfigurasi kamera pertama untuk Partner ini.</p></div></CardContent></Card>
      )}

      {loadState === "success" && profiles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <CameraProfileCard
              key={profile.id}
              profile={profile}
              onEdit={() => setFormState({ profile })}
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
          key={formState.profile?.id ?? "new-camera-profile"}
          partnerId={partnerId}
          profile={formState.profile}
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
    </div>
  )
}
