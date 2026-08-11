import {
  Plus,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useState,
} from "react"
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
import { getUsers } from "@/features/users/user-service"
import {
  isSortDirection,
  isUserSortField,
  isUserStatus,
  type SortDirection,
  type UserListResponse,
  type UserRecord,
  type UserSortField,
} from "@/features/users/user.types"
import { ApiError } from "@/lib/api-client"

import { UserListPagination } from "./user-list-pagination"
import {
  UserListEmptyState,
  UserListErrorState,
  UserListLoadingState,
} from "./user-list-states"
import { UserListTable } from "./user-list-table"
import { UserCreateDialog } from "./user-create-dialog"
import {
  UserListToolbar,
  type UserStatusFilter,
} from "./user-list-toolbar"

const DEFAULT_SORT: UserSortField = "created_at"
const DEFAULT_DIRECTION: SortDirection = "desc"
const DEFAULT_PAGE_SIZE = 10

type LoadState = "loading" | "success" | "error"

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

export function UserListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { token, logout } = useAuth()
  const querySearch = searchParams.get("search") ?? ""
  const statusParam = searchParams.get("status")
  const sortParam = searchParams.get("sort")
  const directionParam = searchParams.get("direction")
  const status: UserStatusFilter = isUserStatus(statusParam)
    ? statusParam
    : "all"
  const sort: UserSortField = isUserSortField(sortParam)
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
    : "/admin/settings/users"
  const [response, setResponse] = useState<UserListResponse | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

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

  useEffect(() => {
    if (!token) return

    const accessToken = token
    const controller = new AbortController()

    async function loadUsers() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const result = await getUsers(
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
            state: { from: "/admin/settings/users" },
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

    void loadUsers()
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
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  async function handleUnauthorized() {
    await logout()
    navigate("/login", { replace: true })
  }

  function handleCreated(user: UserRecord) {
    toast.success(`User ${user.name} berhasil ditambahkan.`)
    setCreateOpen(false)
    setRetryKey((value) => value + 1)
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daftar akun pengguna yang terdaftar di platform.
        </p>
      </header>

      <Card className="min-w-0 shadow-sm">
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Daftar user</CardTitle>
              <CardDescription>
                Pencarian, filter, dan pagination diproses oleh server.
              </CardDescription>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden="true" />
              Tambah user
            </Button>
          </div>
          <UserListToolbar
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
                  nextDirection === DEFAULT_DIRECTION
                    ? null
                    : nextDirection,
                page: null,
              })
            }
            onReset={resetControls}
          />
        </CardHeader>

        <CardContent className="px-0">
          {loadState === "loading" && <UserListLoadingState />}

          {loadState === "error" && (
            <UserListErrorState
              message={errorMessage}
              onRetry={() => setRetryKey((value) => value + 1)}
            />
          )}

          {loadState === "success" && response && (
            <>
              {response.data.length > 0 ? (
                <UserListTable
                  users={response.data}
                  returnTo={returnTo}
                />
              ) : (
                <UserListEmptyState
                  filtered={hasFiltering}
                  onReset={resetControls}
                />
              )}

              <UserListPagination
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

      {createOpen && (
        <UserCreateDialog
          open
          onOpenChange={setCreateOpen}
          onSaved={(user) => handleCreated(user)}
          onUnauthorized={() => void handleUnauthorized()}
        />
      )}

      <Toaster position="top-right" />
    </div>
  )
}
