import {
  CircleAlert,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { FilterCard } from "@/components/kiosk/filter/filter-card"
import { FilterDeleteDialog } from "@/components/kiosk/filter/filter-delete-dialog"
import { FilterFormDialog } from "@/components/kiosk/filter/filter-form-dialog"
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
import { getFilters } from "@/features/filters/filter-service"
import type { FilterRecord } from "@/features/filters/filter.types"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import { ApiError } from "@/lib/api-client"

type LoadState = "loading" | "success" | "error"

export function FilterGlobalSection() {
  const { user } = useAuth()
  const { token, handleApiError, handleUnauthorized, handleForbidden } =
    useApiErrorHandler()
  const superAdmin = isSuperAdmin(user)
  const canView = hasPermission(user, "filters.view")

  const [filters, setFilters] = useState<ReadonlyArray<FilterRecord>>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [formTarget, setFormTarget] = useState<FilterRecord | "new" | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FilterRecord | null>(null)

  const refresh = useCallback(() => setRetryKey((value) => value + 1), [])

  useEffect(() => {
    if (!token || !canView) return
    const accessToken = token
    const controller = new AbortController()

    async function loadFilters() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const result = await getFilters(
          accessToken,
          { scope: "global", per_page: 100 },
          controller.signal
        )
        if (controller.signal.aborted) return
        setFilters(result.data)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (handleApiError(error)) return
        setFilters([])
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server."
        )
        setLoadState("error")
      }
    }

    void loadFilters()
    return () => controller.abort()
  }, [canView, handleApiError, retryKey, token])

  if (!canView) return null

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Global filters</CardTitle>
              <CardDescription>
                Filter Global dipakai sebagai referensi untuk semua Partner.
              </CardDescription>
            </div>
            {superAdmin && (
              <Button onClick={() => setFormTarget("new")}>
                <Plus aria-hidden="true" /> Tambah Filter
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
                <p className="mt-3 font-medium">Global filter gagal dimuat</p>
                <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
                <Button className="mt-4" variant="outline" onClick={refresh}>
                  <RefreshCw aria-hidden="true" /> Coba lagi
                </Button>
              </div>
            </div>
          )}

          {loadState === "success" && filters.length === 0 && (
            <div className="grid min-h-56 place-items-center text-center">
              <div>
                <SlidersHorizontal className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-medium">Belum ada Filter global</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {superAdmin
                    ? "Tambahkan Filter global sebagai referensi Partner."
                    : "Belum ada Filter global yang dapat ditampilkan."}
                </p>
              </div>
            </div>
          )}

          {loadState === "success" && filters.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filters.map((filter) => (
                <FilterCard
                  key={filter.id}
                  filter={filter}
                  onEdit={superAdmin ? () => setFormTarget(filter) : undefined}
                  onDelete={superAdmin ? () => setDeleteTarget(filter) : undefined}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {formTarget && (
        <FilterFormDialog
          key={formTarget === "new" ? "new-global-filter" : `global-filter-${formTarget.id}`}
          partnerId={null}
          filter={formTarget === "new" ? null : formTarget}
          open
          onOpenChange={(open) => !open && setFormTarget(null)}
          onSaved={(filter, isNew) => {
            toast.success(
              isNew
                ? `Filter global ${filter.name} ditambahkan.`
                : `Filter global ${filter.name} diperbarui.`
            )
            refresh()
          }}
          onUnauthorized={handleUnauthorized}
          onForbidden={handleForbidden}
        />
      )}

      {deleteTarget && (
        <FilterDeleteDialog
          key={deleteTarget.id}
          filter={deleteTarget}
          open
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onDeleted={(deleted) => {
            setDeleteTarget(null)
            toast.success(`Filter global ${deleted.name} dihapus.`)
            refresh()
          }}
          onUnauthorized={handleUnauthorized}
          onForbidden={handleForbidden}
        />
      )}
    </div>
  )
}
