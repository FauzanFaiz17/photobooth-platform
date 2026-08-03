import { Plus } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Toaster } from "@/components/ui/sonner"
import { useAuth } from "@/features/auth/auth-context"
import { getPartners } from "@/features/partners/partner-service"
import {
  isPartnerSortField,
  isPartnerStatus,
  type PartnerListResponse,
  type PartnerRecord,
  type PartnerSortField,
} from "@/features/partners/partner.types"
import { ApiError } from "@/lib/api-client"
import { isSortDirection, type SortDirection } from "@/lib/pagination"

import { PartnerDeleteDialog } from "./partner-delete-dialog"
import { PartnerFormDialog } from "./partner-form-dialog"
import { PartnerListPagination } from "./partner-list-pagination"
import {
  PartnerListEmptyState,
  PartnerListErrorState,
  PartnerListLoadingState,
} from "./partner-list-states"
import { PartnerListTable } from "./partner-list-table"
import {
  PartnerListToolbar,
  type PartnerStatusFilter,
} from "./partner-list-toolbar"

const PARTNERS_PATH = "/admin/settings/users?tab=partners"
const DEFAULT_SORT: PartnerSortField = "created_at"
const DEFAULT_DIRECTION: SortDirection = "desc"
const DEFAULT_PAGE_SIZE = 10

type LoadState = "loading" | "success" | "error"

/** null berarti dialog tertutup; partner null berarti mode tambah. */
interface FormDialogState {
  readonly partner: PartnerRecord | null
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) return fallback

  const parsedValue = Number(value)
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback
}

function parsePageSize(value: string | null): number {
  const parsedValue = parsePositiveInteger(value, DEFAULT_PAGE_SIZE)

  if (
    parsedValue === 5 ||
    parsedValue === 10 ||
    parsedValue === 25 ||
    parsedValue === 50 ||
    parsedValue === 100
  ) {
    return parsedValue
  }

  return DEFAULT_PAGE_SIZE
}

export function PartnerListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { token, logout } = useAuth()
  const querySearch = searchParams.get("search") ?? ""
  const statusParam = searchParams.get("status")
  const sortParam = searchParams.get("sort")
  const directionParam = searchParams.get("direction")
  const status: PartnerStatusFilter = isPartnerStatus(statusParam)
    ? statusParam
    : "all"
  const sort: PartnerSortField = isPartnerSortField(sortParam)
    ? sortParam
    : DEFAULT_SORT
  const direction: SortDirection = isSortDirection(directionParam)
    ? directionParam
    : DEFAULT_DIRECTION
  const pageSize = parsePageSize(searchParams.get("per_page"))
  const page = parsePositiveInteger(searchParams.get("page"), 1)
  const queryString = searchParams.toString()
  const returnTo = queryString
    ? `/admin/settings/users?${queryString}`
    : PARTNERS_PATH
  const [response, setResponse] = useState<PartnerListResponse | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [formDialog, setFormDialog] = useState<FormDialogState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PartnerRecord | null>(null)

  const updateQuery = useCallback(
    (updates: Readonly<Record<string, string | null>>) => {
      setSearchParams(
        (currentParams) => {
          const nextParams = new URLSearchParams(currentParams)

          for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === "") {
              nextParams.delete(key)
            } else {
              nextParams.set(key, value)
            }
          }

          return nextParams
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const handleSearchChange = useCallback(
    (search: string) => {
      updateQuery({
        search: search || null,
        page: null,
      })
    },
    [updateQuery]
  )

  const refresh = useCallback(() => {
    setRetryKey((value) => value + 1)
  }, [])

  const handleUnauthorized = useCallback(async () => {
    await logout()
    navigate("/login", { replace: true })
  }, [logout, navigate])

  useEffect(() => {
    if (!token) return

    const accessToken = token
    const controller = new AbortController()

    async function loadPartners() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const result = await getPartners(
          accessToken,
          {
            search: querySearch || undefined,
            status: status === "all" ? undefined : status,
            sort,
            direction,
            per_page: pageSize,
            page,
          },
          controller.signal
        )

        if (controller.signal.aborted) return

        if (page > Math.max(1, result.meta.last_page)) {
          const lastPage = Math.max(1, result.meta.last_page)
          updateQuery({
            page: lastPage === 1 ? null : String(lastPage),
          })
          return
        }

        setResponse(result)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return

        if (error instanceof ApiError && error.status === 401) {
          await logout()
          navigate("/login", { replace: true })
          return
        }

        if (error instanceof ApiError && error.status === 403) {
          navigate("/admin/forbidden", {
            replace: true,
            state: { from: PARTNERS_PATH },
          })
          return
        }

        setResponse(null)
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
        )
        setLoadState("error")
      }
    }

    void loadPartners()
    return () => controller.abort()
  }, [
    direction,
    logout,
    navigate,
    page,
    pageSize,
    querySearch,
    retryKey,
    sort,
    status,
    token,
    updateQuery,
  ])

  const hasFiltering = querySearch.trim().length > 0 || status !== "all"
  const hasChangedControls =
    hasFiltering ||
    sort !== DEFAULT_SORT ||
    direction !== DEFAULT_DIRECTION ||
    pageSize !== DEFAULT_PAGE_SIZE

  function resetControls() {
    setSearchParams(new URLSearchParams({ tab: "partners" }), {
      replace: true,
    })
  }

  function handleSaved(partner: PartnerRecord, isNew: boolean) {
    toast.success(
      isNew
        ? `Partner ${partner.company_name} berhasil ditambahkan.`
        : `Partner ${partner.company_name} berhasil diperbarui.`
    )

    if (isNew) updateQuery({ page: null })
    refresh()
  }

  function handleDeleted(partner: PartnerRecord) {
    toast.success(`Partner ${partner.company_name} berhasil dihapus.`)
    setDeleteTarget(null)
    refresh()
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Partners
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daftar perusahaan mitra yang terdaftar di platform.
        </p>
      </header>

      <Card className="min-w-0 shadow-sm">
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Daftar partner</CardTitle>
              <CardDescription>
                Pencarian, filter, dan pagination diproses oleh server.
              </CardDescription>
            </div>
            <Button onClick={() => setFormDialog({ partner: null })}>
              <Plus aria-hidden="true" />
              Tambah partner
            </Button>
          </div>
          <PartnerListToolbar
            key={querySearch}
            initialSearch={querySearch}
            status={status}
            sort={sort}
            direction={direction}
            canReset={hasChangedControls}
            onSearchChange={handleSearchChange}
            onStatusChange={(nextStatus) =>
              updateQuery({
                status: nextStatus === "all" ? null : nextStatus,
                page: null,
              })
            }
            onSortChange={(nextSort) =>
              updateQuery({
                sort: nextSort === DEFAULT_SORT ? null : nextSort,
                page: null,
              })
            }
            onDirectionChange={(nextDirection) =>
              updateQuery({
                direction:
                  nextDirection === DEFAULT_DIRECTION ? null : nextDirection,
                page: null,
              })
            }
            onReset={resetControls}
          />
        </CardHeader>

        <CardContent className="px-0">
          {loadState === "loading" && <PartnerListLoadingState />}

          {loadState === "error" && (
            <PartnerListErrorState
              message={errorMessage}
              onRetry={refresh}
            />
          )}

          {loadState === "success" && response && (
            <>
              {response.data.length > 0 ? (
                <PartnerListTable
                  partners={response.data}
                  returnTo={returnTo}
                  onEdit={(partner) => setFormDialog({ partner })}
                  onDelete={(partner) => setDeleteTarget(partner)}
                />
              ) : (
                <PartnerListEmptyState
                  filtered={hasFiltering}
                  onReset={resetControls}
                  onCreate={() => setFormDialog({ partner: null })}
                />
              )}

              <PartnerListPagination
                meta={response.meta}
                onPageChange={(nextPage) =>
                  updateQuery({
                    page: nextPage === 1 ? null : String(nextPage),
                  })
                }
                onPageSizeChange={(nextPageSize) =>
                  updateQuery({
                    per_page:
                      nextPageSize === DEFAULT_PAGE_SIZE
                        ? null
                        : String(nextPageSize),
                    page: null,
                  })
                }
              />
            </>
          )}
        </CardContent>
      </Card>

      {formDialog && (
        <PartnerFormDialog
          key={formDialog.partner?.id ?? "new-partner"}
          partner={formDialog.partner}
          open
          onOpenChange={(open) => {
            if (!open) setFormDialog(null)
          }}
          onSaved={handleSaved}
          onUnauthorized={() => void handleUnauthorized()}
        />
      )}

      {deleteTarget && (
        <PartnerDeleteDialog
          key={deleteTarget.id}
          partner={deleteTarget}
          open
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          onDeleted={handleDeleted}
          onUnauthorized={() => void handleUnauthorized()}
        />
      )}

      <Toaster position="top-right" />
    </div>
  )
}
