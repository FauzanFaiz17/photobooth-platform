import { CircleAlert, Pencil, Plus, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"
import { getFilters } from "@/features/filters/filter-service"
import type { FilterRecord } from "@/features/filters/filter.types"
import { ApiError } from "@/lib/api-client"

import { FilterDeleteDialog } from "./filter-delete-dialog"
import { FilterFormDialog } from "./filter-form-dialog"

function FilterCard({ filter, onEdit, onDelete }: { readonly filter: FilterRecord; readonly onEdit?: () => void; readonly onDelete?: () => void }) {
  return (
    <Card>
      <CardHeader className="border-b"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate">{filter.name}</CardTitle><CardDescription className="mt-1">Versi {filter.version}</CardDescription></div><div className="flex flex-wrap justify-end gap-1">{filter.is_global && <Badge variant="outline">Global</Badge>}<Badge variant={filter.is_active ? "default" : "secondary"}>{filter.is_active ? "Aktif" : "Nonaktif"}</Badge></div></div></CardHeader>
      <CardContent><dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div><dt className="text-xs text-muted-foreground">Brightness</dt><dd className="mt-1 font-medium">{filter.brightness}</dd></div><div><dt className="text-xs text-muted-foreground">Contrast</dt><dd className="mt-1 font-medium">{filter.contrast}</dd></div><div><dt className="text-xs text-muted-foreground">Saturation</dt><dd className="mt-1 font-medium">{filter.saturation}</dd></div><div><dt className="text-xs text-muted-foreground">Sharpness</dt><dd className="mt-1 font-medium">{filter.sharpness}</dd></div><div><dt className="text-xs text-muted-foreground">White balance</dt><dd className="mt-1 font-medium">{filter.white_balance}</dd></div><div><dt className="text-xs text-muted-foreground">Intensity</dt><dd className="mt-1 font-medium">{filter.intensity}%</dd></div><div className="col-span-2"><dt className="text-xs text-muted-foreground">LUT path</dt><dd className="mt-1 truncate font-medium" title={filter.lut_path ?? undefined}>{filter.lut_path || "—"}</dd></div></dl></CardContent>
      {!filter.is_global && onEdit && onDelete && <CardFooter className="justify-end gap-2"><Button size="sm" variant="outline" onClick={onEdit}><Pencil aria-hidden="true" /> Edit</Button><Button size="sm" variant="destructive" onClick={onDelete}><Trash2 aria-hidden="true" /> Hapus</Button></CardFooter>}
    </Card>
  )
}

export function FilterTab({ partnerId, onUnauthorized, onForbidden }: { readonly partnerId: number; readonly onUnauthorized: () => void; readonly onForbidden: () => void }) {
  const { token } = useAuth()
  const [filters, setFilters] = useState<ReadonlyArray<FilterRecord>>([])
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [formFilter, setFormFilter] = useState<FilterRecord | null | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<FilterRecord | null>(null)
  const refresh = useCallback(() => setRetryKey((value) => value + 1), [])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    const controller = new AbortController()

    async function loadFilters() {
      setLoadState("loading")
      setErrorMessage("")
      try {
        const [partnerFilters, globalFilters] = await Promise.all([
          getFilters(accessToken, { scope: "partner", partner_id: partnerId, per_page: 100 }, controller.signal),
          getFilters(accessToken, { scope: "global", per_page: 100 }, controller.signal),
        ])
        if (controller.signal.aborted) return
        setFilters([...partnerFilters.data, ...globalFilters.data])
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) return onUnauthorized()
        if (error instanceof ApiError && error.status === 403) return onForbidden()
        setFilters([])
        setErrorMessage(error instanceof ApiError ? error.message : "Tidak dapat terhubung ke server.")
        setLoadState("error")
      }
    }

    void loadFilters()
    return () => controller.abort()
  }, [onForbidden, onUnauthorized, partnerId, retryKey, token])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Filters</h2><p className="mt-1 text-sm text-muted-foreground">Filter Partner berlaku untuk seluruh Booth; Filter Global hanya ditampilkan sebagai referensi.</p></div><Button onClick={() => setFormFilter(null)}><Plus aria-hidden="true" /> Tambah Filter</Button></div>
      {loadState === "loading" && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>{[0, 1, 2].map((item) => <Skeleton key={item} className="h-80 rounded-xl" />)}</div>}
      {loadState === "error" && <Card><CardContent className="grid min-h-56 place-items-center text-center"><div><CircleAlert className="mx-auto size-9 text-destructive" /><p className="mt-3 font-medium">Filter gagal dimuat</p><p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p><Button className="mt-4" variant="outline" onClick={refresh}><RefreshCw aria-hidden="true" /> Coba lagi</Button></div></CardContent></Card>}
      {loadState === "success" && filters.length === 0 && <Card><CardContent className="grid min-h-56 place-items-center text-center"><div><SlidersHorizontal className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-medium">Belum ada Filter</p><p className="mt-1 text-sm text-muted-foreground">Tambahkan Filter pertama untuk Partner ini.</p></div></CardContent></Card>}
      {loadState === "success" && filters.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filters.map((filter) => <FilterCard key={filter.id} filter={filter} onEdit={filter.is_global ? undefined : () => setFormFilter(filter)} onDelete={filter.is_global ? undefined : () => setDeleteTarget(filter)} />)}</div>}
      <div className="rounded-lg border p-3 text-sm text-muted-foreground"><SlidersHorizontal className="mr-2 inline size-4" aria-hidden="true" />Filter aktif dapat dipilih ketika membuat Event dan disimpan sebagai snapshot konfigurasi.</div>

      {formFilter !== undefined && <FilterFormDialog key={formFilter?.id ?? "new-filter"} partnerId={partnerId} filter={formFilter} open onOpenChange={(open) => !open && setFormFilter(undefined)} onSaved={(saved, isNew) => { toast.success(isNew ? `Filter ${saved.name} ditambahkan.` : `Filter ${saved.name} diperbarui.`); refresh() }} onUnauthorized={onUnauthorized} onForbidden={onForbidden} />}
      {deleteTarget && <FilterDeleteDialog key={deleteTarget.id} filter={deleteTarget} open onOpenChange={(open) => !open && setDeleteTarget(null)} onDeleted={(deleted) => { setDeleteTarget(null); toast.success(`Filter ${deleted.name} dihapus.`); refresh() }} onUnauthorized={onUnauthorized} onForbidden={onForbidden} />}
    </div>
  )
}
