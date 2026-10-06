import {
  CircleAlert,
  Plus,
  Printer,
  RefreshCw,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { PrinterProfileCard } from "@/components/kiosk/printer/printer-profile-card"
import { PrinterProfileDeleteDialog } from "@/components/kiosk/printer/printer-profile-delete-dialog"
import { PrinterProfileFormDialog } from "@/components/kiosk/printer/printer-profile-form-dialog"
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
import { getPrinterProfiles } from "@/features/printer-profiles/printer-profile-service"
import type { PrinterProfileRecord } from "@/features/printer-profiles/printer-profile.types"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import { ApiError } from "@/lib/api-client"

type LoadState = "loading" | "success" | "error"

export function GlobalPrinterProfilesSection() {
  const { user } = useAuth()
  const { token, handleApiError, handleUnauthorized, handleForbidden } =
    useApiErrorHandler()
  const superAdmin = isSuperAdmin(user)
  const canView = hasPermission(user, "printer_profiles.view")

  const [profiles, setProfiles] = useState<ReadonlyArray<PrinterProfileRecord>>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [formTarget, setFormTarget] = useState<PrinterProfileRecord | "new" | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PrinterProfileRecord | null>(null)

  const refresh = useCallback(() => setRetryKey((value) => value + 1), [])

  useEffect(() => {
    if (!token || !canView) return
    const accessToken = token
    const controller = new AbortController()

    async function loadProfiles() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const result = await getPrinterProfiles(
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Global printer profiles</CardTitle>
              <CardDescription>
                Profile Global dipakai sebagai referensi untuk semua Partner.
              </CardDescription>
            </div>
            {superAdmin && (
              <Button onClick={() => setFormTarget("new")}>
                <Plus aria-hidden="true" /> Tambah profile global
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loadState === "loading" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-72 rounded-xl" />
              ))}
            </div>
          )}

          {loadState === "error" && (
            <div className="grid min-h-56 place-items-center text-center">
              <div>
                <CircleAlert className="mx-auto size-9 text-destructive" aria-hidden="true" />
                <p className="mt-3 font-medium">Global printer profile gagal dimuat</p>
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
                <Printer className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-medium">Belum ada profile global</p>
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
                <PrinterProfileCard
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
        <PrinterProfileFormDialog
          key={formTarget === "new" ? "new-global-profile" : `global-profile-${formTarget.id}`}
          partnerId={null}
          profile={formTarget === "new" ? null : formTarget}
          open
          onOpenChange={(open) => !open && setFormTarget(null)}
          onSaved={(profile, isNew) => {
            toast.success(
              isNew
                ? `Profile global ${profile.printer_name} ditambahkan.`
                : `Profile global ${profile.printer_name} diperbarui.`
            )
            refresh()
          }}
          onUnauthorized={handleUnauthorized}
          onForbidden={handleForbidden}
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
            toast.success(`Profile global ${profile.printer_name} dihapus.`)
            refresh()
          }}
          onUnauthorized={handleUnauthorized}
          onForbidden={handleForbidden}
        />
      )}
    </div>
  )
}
