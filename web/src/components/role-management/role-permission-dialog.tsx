import { LoaderCircle, ShieldAlert } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getPermissions,
  syncRolePermissions,
} from "@/features/roles/role-service"
import type {
  PermissionGroup,
  RoleRecord,
} from "@/features/roles/role.types"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import { ApiError } from "@/lib/api-client"

const SUPER_ADMIN_ROLE_SLUG = "super-admin"

type LoadState = "loading" | "success" | "error"

interface RolePermissionDialogProps {
  readonly role: RoleRecord
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSaved: (role: RoleRecord) => void
}

function PermissionMatrixSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      {[0, 1, 2].map((section) => (
        <div key={section} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function RolePermissionDialog({
  role,
  open,
  onOpenChange,
  onSaved,
}: RolePermissionDialogProps) {
  const { token, handleApiError } = useApiErrorHandler()
  const [groups, setGroups] = useState<ReadonlyArray<PermissionGroup>>([])
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(
    () => new Set(role.permission_ids)
  )
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [pending, setPending] = useState(false)

  const locked = role.slug === SUPER_ADMIN_ROLE_SLUG

  useEffect(() => {
    if (!open || !token) return

    const accessToken = token
    const controller = new AbortController()

    async function loadPermissions() {
      setLoadState("loading")
      setLoadError("")

      try {
        const result = await getPermissions(accessToken, controller.signal)
        if (controller.signal.aborted) return
        setGroups(result)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (handleApiError(error)) return
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "Daftar permission tidak dapat dimuat."
        )
        setLoadState("error")
      }
    }

    void loadPermissions()
    return () => controller.abort()
  }, [handleApiError, open, token])

  function setPermission(permissionId: number, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) {
        next.add(permissionId)
      } else {
        next.delete(permissionId)
      }
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || pending || locked) return

    setPending(true)
    setSaveError("")

    try {
      const updated = await syncRolePermissions(
        token,
        role.id,
        [...selectedIds]
      )
      onSaved(updated)
    } catch (error: unknown) {
      if (handleApiError(error)) return
      setSaveError(
        error instanceof ApiError
          ? error.message
          : "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permission role {role.name}</DialogTitle>
          <DialogDescription>
            Centang permission yang dimiliki role ini, lalu simpan.
          </DialogDescription>
        </DialogHeader>

        {locked && (
          <Alert variant="destructive">
            <ShieldAlert aria-hidden="true" />
            <AlertTitle>Tidak dapat diubah</AlertTitle>
            <AlertDescription>
              Permission role Super Admin dikunci dan tidak dapat diubah.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className="max-h-[60vh] space-y-5 overflow-y-auto px-1 py-1">
            {loadState === "loading" && <PermissionMatrixSkeleton />}

            {loadState === "error" && (
              <p role="alert" className="text-sm text-destructive">
                {loadError}
              </p>
            )}

            {loadState === "success" &&
              groups.map((group) => (
                <section key={group.module}>
                  <h3 className="text-sm font-semibold capitalize text-foreground">
                    {group.module}
                  </h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {group.permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`permission-${permission.id}`}
                          checked={selectedIds.has(permission.id)}
                          disabled={locked}
                          onCheckedChange={(checked) =>
                            setPermission(permission.id, checked)
                          }
                        />
                        <Label
                          htmlFor={`permission-${permission.id}`}
                          className="cursor-pointer font-normal"
                        >
                          {permission.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
          </div>

          {saveError && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {saveError}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={pending || locked || loadState !== "success"}
            >
              {pending && (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              )}
              Simpan permission
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
