import { CircleAlert, KeyRound, RefreshCw, ShieldCheck } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getRoles } from "@/features/roles/role-service"
import type { RoleRecord } from "@/features/roles/role.types"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import { ApiError } from "@/lib/api-client"

import { RolePermissionDialog } from "./role-permission-dialog"

type LoadState = "loading" | "success" | "error"

const skeletonRows = Array.from({ length: 5 }, (_, index) => index)

function RoleListLoadingState() {
  return (
    <div aria-label="Memuat daftar role" aria-busy="true">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Nama</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Jumlah user</TableHead>
            <TableHead>Jumlah permission</TableHead>
            <TableHead className="pr-6 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skeletonRows.map((row) => (
            <TableRow key={row}>
              <TableCell className="pl-6">
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-12 rounded-full" />
              </TableCell>
              <TableCell className="pr-6">
                <Skeleton className="ml-auto h-7 w-32" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function RoleListErrorState({
  message,
  onRetry,
}: {
  readonly message: string
  readonly onRetry: () => void
}) {
  return (
    <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
      <div className="max-w-md">
        <CircleAlert
          className="mx-auto size-9 text-destructive"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Daftar role gagal dimuat
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Coba lagi
        </Button>
      </div>
    </div>
  )
}

function RoleListEmptyState() {
  return (
    <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
      <div className="max-w-md">
        <ShieldCheck
          className="mx-auto size-9 text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Belum ada role
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Belum ada role yang dapat ditampilkan.
        </p>
      </div>
    </div>
  )
}

function RoleListTable({
  roles,
  onManage,
}: {
  readonly roles: ReadonlyArray<RoleRecord>
  readonly onManage: (role: RoleRecord) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">Nama</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Level</TableHead>
          <TableHead>Jumlah user</TableHead>
          <TableHead>Jumlah permission</TableHead>
          <TableHead className="pr-6 text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow key={role.id}>
            <TableCell className="pl-6 font-medium text-foreground">
              {role.name}
            </TableCell>
            <TableCell className="font-mono text-muted-foreground">
              {role.slug}
            </TableCell>
            <TableCell>{role.level}</TableCell>
            <TableCell>{role.users_count}</TableCell>
            <TableCell>
              <Badge variant="secondary">{role.permission_ids.length}</Badge>
            </TableCell>
            <TableCell className="pr-6 text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onManage(role)}
              >
                <KeyRound aria-hidden="true" />
                Kelola permission
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function RoleListPage() {
  const { token, handleApiError } = useApiErrorHandler()
  const [roles, setRoles] = useState<ReadonlyArray<RoleRecord>>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null)

  useEffect(() => {
    if (!token) return

    const accessToken = token
    const controller = new AbortController()

    async function loadRoles() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const result = await getRoles(accessToken, controller.signal)
        if (controller.signal.aborted) return
        setRoles(result)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (handleApiError(error)) return
        setRoles([])
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
        )
        setLoadState("error")
      }
    }

    void loadRoles()
    return () => controller.abort()
  }, [handleApiError, retryKey, token])

  const handleSaved = useCallback((updated: RoleRecord) => {
    setRoles((current) =>
      current.map((role) => (role.id === updated.id ? updated : role))
    )
    toast.success(`Permission role ${updated.name} berhasil diperbarui.`)
    setSelectedRole(null)
  }, [])

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Roles
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola role dan permission akses pengguna.
        </p>
      </header>

      <Card className="min-w-0 shadow-sm">
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>Daftar role</CardTitle>
            <CardDescription>
              Pilih role untuk mengatur permission yang dimilikinya.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {loadState === "loading" && <RoleListLoadingState />}

          {loadState === "error" && (
            <RoleListErrorState
              message={errorMessage}
              onRetry={() => setRetryKey((value) => value + 1)}
            />
          )}

          {loadState === "success" &&
            (roles.length > 0 ? (
              <RoleListTable roles={roles} onManage={setSelectedRole} />
            ) : (
              <RoleListEmptyState />
            ))}
        </CardContent>
      </Card>

      {selectedRole && (
        <RolePermissionDialog
          key={selectedRole.id}
          role={selectedRole}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedRole(null)
          }}
          onSaved={handleSaved}
        />
      )}

      <Toaster position="top-right" />
    </div>
  )
}
