import {
  Aperture,
  CircleAlert,
  Plus,
  RefreshCw,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { CameraProfileCard } from "@/components/kiosk/camera/camera-profile-card"
import { CameraProfileDeleteDialog } from "@/components/kiosk/camera/camera-profile-delete-dialog"
import { CameraProfileFormDialog } from "@/components/kiosk/camera/camera-profile-form-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  hasPermission,
  isSuperAdmin,
} from "@/features/auth/auth-access"
import { useAuth } from "@/features/auth/auth-context"
import { getCameraProfiles } from "@/features/camera-profiles/camera-profile-service"
import type { CameraProfileRecord } from "@/features/camera-profiles/camera-profile.types"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import { ApiError } from "@/lib/api-client"

type LoadState = "loading" | "success" | "error"

export function CameraGlobalSection() {
  const { user } = useAuth()
  const { token, handleApiError, handleUnauthorized, handleForbidden } =
    useApiErrorHandler()
  const superAdmin = isSuperAdmin(user)
  const canView = hasPermission(user, "camera_profiles.view")

  const [profiles, setProfiles] = useState<ReadonlyArray<CameraProfileRecord>>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [formTarget, setFormTarget] = useState<CameraProfileRecord | "new" | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CameraProfileRecord | null>(null)

  const refresh = useCallback(() => setRetryKey((value) => value + 1), [])

  useEffect(() => {
    if (!token || !canView) return
    const accessToken = token
    const controller = new AbortController()

    async function loadProfiles() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const result = await getCameraProfiles(
          accessToken,
          { scope: "global", per_page: 100 },
          controller.signal
        )
        if (controller.signal.aborted) return
        setProfiles(result.data)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (handleApiError(error)) return
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
  }, [canView, handleApiError, retryKey, token])

  if (!canView) return null

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Global camera profiles</CardTitle>
              <CardDescription>
                Profile Global dipakai sebagai referensi untuk semua Partner.
              </CardDescription>
            </div>
            {superAdmin && (
              <Button onClick={() => setFormTarget("new")}>
                <Plus aria-hidden="true" /> Tambah camera profile
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loadState === "loading" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-80 rounded-xl" />
              ))}
            </div>
          )}

          {loadState === "error" && (
            <div className="grid min-h-56 place-items-center text-center">
              <div>
                <CircleAlert className="mx-auto size-9 text-destructive" aria-hidden="true" />
                <p className="mt-3 font-medium">Global camera profile gagal dimuat</p>
                <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
                <Button className="mt-4" variant="outline" onClick={refresh}>
                  <RefreshCw aria-hidden="true" /> Coba lagi
                </Button>
              </div>
            </div>
          )}

          {loadState === "success" && profiles.length === 0 && (
            <div className="grid min-h-56 place-items-center text-center">
              <div>
                <Aperture className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-medium">Belum ada camera profile global</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {superAdmin
                    ? "Tambahkan profile global sebagai referensi Partner."
                    : "Belum ada profile global yang dapat ditampilkan."}
                </p>
              </div>
            </div>
          )}

          {loadState === "success" && profiles.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => (
                <CameraProfileCard
                  key={profile.id}
                  profile={profile}
                  onEdit={superAdmin ? () => setFormTarget(profile) : undefined}
                  onDelete={superAdmin ? () => setDeleteTarget(profile) : undefined}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {formTarget && (
        <CameraProfileFormDialog
          key={formTarget === "new" ? "new-global-camera" : `global-camera-${formTarget.id}`}
          partnerId={null}
          profile={formTarget === "new" ? null : formTarget}
          open
          onOpenChange={(open) => !open && setFormTarget(null)}
          onSaved={(profile, isNew) => {
            toast.success(
              isNew
                ? `Camera profile global ${profile.name} ditambahkan.`
                : `Camera profile global ${profile.name} diperbarui.`
            )
            refresh()
          }}
          onUnauthorized={handleUnauthorized}
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
            toast.success(`Camera profile global ${profile.name} dihapus.`)
            refresh()
          }}
          onUnauthorized={handleUnauthorized}
          onForbidden={handleForbidden}
        />
      )}
    </div>
  )
}
