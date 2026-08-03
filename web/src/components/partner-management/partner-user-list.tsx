import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  createUserInitials,
  formatUserDate,
} from "@/components/user-management/user-formatters"
import type { UserStatusFilter } from "@/components/user-management/user-list-toolbar"
import { UserStatusBadge } from "@/components/user-management/user-status-badge"
import { useAuth } from "@/features/auth/auth-context"
import { getUsers } from "@/features/users/user-service"
import type { UserListResponse } from "@/features/users/user.types"
import { ApiError, resolveStorageUrl } from "@/lib/api-client"

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 400

type LoadState = "loading" | "success" | "error"

const skeletonRows = Array.from({ length: 3 }, (_, index) => index)

interface PartnerUserListProps {
  readonly partnerId: number
  readonly partnerName: string
  readonly onUnauthorized: () => void
}

export function PartnerUserList({
  partnerId,
  partnerName,
  onUnauthorized,
}: PartnerUserListProps) {
  const { token } = useAuth()
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<UserStatusFilter>("all")
  const [page, setPage] = useState(1)
  const [response, setResponse] = useState<UserListResponse | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const normalizedSearch = searchInput.trim()
    if (normalizedSearch === search) return

    const timeoutId = window.setTimeout(() => {
      setSearch(normalizedSearch)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [search, searchInput])

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
            partner: partnerId,
            search: search || undefined,
            status: status === "all" ? undefined : status,
            sort: "created_at",
            direction: "desc",
            per_page: PAGE_SIZE,
            page,
          },
          controller.signal
        )

        if (controller.signal.aborted) return

        if (page > Math.max(1, result.meta.last_page)) {
          setPage(Math.max(1, result.meta.last_page))
          return
        }

        setResponse(result)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return

        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized()
          return
        }

        setResponse(null)
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Daftar user tidak dapat dimuat."
        )
        setLoadState("error")
      }
    }

    void loadUsers()
    return () => controller.abort()
  }, [onUnauthorized, page, partnerId, retryKey, search, status, token])

  const meta = response?.meta
  const totalPages = Math.max(1, meta?.last_page ?? 1)
  const hasFiltering = search.length > 0 || status !== "all"

  return (
    <Card className="min-w-0 shadow-sm">
      <CardHeader className="gap-4 border-b">
        <div>
          <CardTitle>User partner ini</CardTitle>
          <CardDescription>
            Akun yang terhubung ke {partnerName}. Partner tidak dapat dihapus
            selama masih memiliki user.
          </CardDescription>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(14rem,1fr)_12rem]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-9 pl-9"
              placeholder="Cari nama atau email"
              aria-label="Cari user pada partner ini"
            />
          </div>

          <Select<UserStatusFilter>
            value={status}
            onValueChange={(value) => {
              if (value === null) return
              setStatus(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-9 w-full" aria-label="Filter status user">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        {loadState === "loading" && (
          <div className="space-y-4 px-6 py-5" aria-busy="true">
            {skeletonRows.map((row) => (
              <div key={row} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        )}

        {loadState === "error" && (
          <div className="grid min-h-48 place-items-center px-6 py-10 text-center">
            <div className="max-w-md">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setRetryKey((value) => value + 1)}
              >
                <RefreshCw aria-hidden="true" />
                Coba lagi
              </Button>
            </div>
          </div>
        )}

        {loadState === "success" && response && (
          <>
            {response.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terakhir login</TableHead>
                    <TableHead className="pr-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {response.data.map((user) => {
                    const avatarUrl = resolveStorageUrl(user.avatar)

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="min-w-56 pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              {avatarUrl && (
                                <AvatarImage src={avatarUrl} alt={user.name} />
                              )}
                              <AvatarFallback>
                                {createUserInitials(user.name) || "US"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {user.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.role.name ?? "Tanpa role"}
                        </TableCell>
                        <TableCell>
                          <UserStatusBadge status={user.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatUserDate(user.last_login_at, "Belum pernah")}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            render={
                              <Link to={`/admin/settings/users/${user.id}`} />
                            }
                          >
                            Lihat detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="grid min-h-48 place-items-center px-6 py-10 text-center">
                <div className="max-w-md">
                  <UsersRound
                    className="mx-auto size-9 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {hasFiltering
                      ? "User tidak ditemukan"
                      : "Belum ada user"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {hasFiltering
                      ? "Coba ubah kata pencarian atau filter status."
                      : "Partner ini belum memiliki akun pengguna."}
                  </p>
                </div>
              </div>
            )}

            {meta && (
              <div className="flex flex-col gap-3 border-t px-4 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm tabular-nums text-muted-foreground">
                  {meta.from ?? 0}–{meta.to ?? 0} dari {meta.total} user
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page <= 1}
                    onClick={() => setPage(meta.current_page - 1)}
                  >
                    <ChevronLeft aria-hidden="true" />
                    Sebelumnya
                  </Button>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {meta.current_page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page >= totalPages}
                    onClick={() => setPage(meta.current_page + 1)}
                  >
                    Berikutnya
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
