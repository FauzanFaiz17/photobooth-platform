import {
  ArrowLeft,
  Building2,
  CircleAlert,
  MapPin,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { PartnerStatusBadge } from "@/components/partner-management/partner-status-badge"
import {
  formatPartnerDateTime,
  getPartnerDisplayName,
  getPartnerPlanName,
} from "@/components/partner-management/partner-formatters"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { useAuth } from "@/features/auth/auth-context"
import { getBooths } from "@/features/booths/booth-service"
import type {
  BoothRecord,
  BoothStatus,
} from "@/features/booths/booth.types"
import { getPartner } from "@/features/partners/partner-service"
import type { PartnerRecord } from "@/features/partners/partner.types"
import { ApiError } from "@/lib/api-client"

import { BoothDeleteDialog } from "./booth-delete-dialog"
import { BoothFormDialog } from "./booth-form-dialog"

const KIOSK_LIST_PATH = "/admin/kiosk"

type LoadState = "loading" | "success" | "not-found" | "error"

interface FormDialogState {
  readonly booth: BoothRecord | null
}

const statusLabels: Record<BoothStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  inactive: "Inactive",
}

function parsePartnerId(value: string | undefined): number | null {
  const partnerId = Number(value)
  return Number.isInteger(partnerId) && partnerId > 0 ? partnerId : null
}

function BoothStatusBadge({ status }: { readonly status: BoothStatus }) {
  const variant =
    status === "active"
      ? "default"
      : status === "maintenance"
        ? "secondary"
        : "outline"

  return <Badge variant={variant}>{statusLabels[status]}</Badge>
}

function BoothCard({
  booth,
  onEdit,
  onDelete,
}: {
  readonly booth: BoothRecord
  readonly onEdit: () => void
  readonly onDelete: () => void
}) {
  return (
    <Card>
      <Link
        to={`/admin/kiosk/${booth.partner.id}/booths/${booth.id}`}
        className="grid gap-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Buka detail Booth ${booth.name}`}
      >
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate">{booth.name}</CardTitle>
              <CardDescription className="mt-1">
                Booth #{booth.id}
              </CardDescription>
            </div>
            <BoothStatusBadge status={booth.status} />
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          <div className="flex items-start gap-3 text-sm">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>{booth.location || "Lokasi belum diisi"}</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Monitor
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>{booth.devices_count ?? 0} device terdaftar</span>
          </div>
        </CardContent>
      </Link>

      <CardFooter className="flex-wrap justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Dibuat {formatPartnerDateTime(booth.created_at)}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil aria-hidden="true" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 aria-hidden="true" />
            Hapus
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function DetailLoadingState() {
  return (
    <div className="space-y-6" aria-label="Memuat detail kiosk" aria-busy>
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-44 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function KioskBoothDetailPage() {
  const { partnerId: partnerIdParam } = useParams<{ partnerId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const partnerId = parsePartnerId(partnerIdParam)
  const [partner, setPartner] = useState<PartnerRecord | null>(null)
  const [booths, setBooths] = useState<ReadonlyArray<BoothRecord>>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [formDialog, setFormDialog] = useState<FormDialogState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BoothRecord | null>(null)

  const handleUnauthorized = useCallback(async () => {
    await logout()
    navigate("/login", { replace: true, state: { from: location } })
  }, [location, logout, navigate])

  useEffect(() => {
    if (!token || partnerId === null) return

    const accessToken = token
    const requestedPartnerId = partnerId
    const controller = new AbortController()

    async function loadDetail() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const [partnerResponse, boothResponse] = await Promise.all([
          getPartner(accessToken, requestedPartnerId, controller.signal),
          // ponytail: subscription limits keep a partner below this ceiling.
          getBooths(
            accessToken,
            {
              partner: requestedPartnerId,
              sort: "name",
              direction: "asc",
              per_page: 100,
            },
            controller.signal
          ),
        ])

        if (controller.signal.aborted) return

        setPartner(partnerResponse)
        setBooths(boothResponse.data)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return

        if (error instanceof ApiError && error.status === 401) {
          await handleUnauthorized()
          return
        }
        if (error instanceof ApiError && error.status === 403) {
          navigate("/admin/forbidden", {
            replace: true,
            state: { from: location.pathname },
          })
          return
        }
        if (error instanceof ApiError && error.status === 404) {
          setLoadState("not-found")
          return
        }

        setPartner(null)
        setBooths([])
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
        )
        setLoadState("error")
      }
    }

    void loadDetail()
    return () => controller.abort()
  }, [
    handleUnauthorized,
    location.pathname,
    navigate,
    partnerId,
    retryKey,
    token,
  ])

  if (partnerId === null) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="grid min-h-72 place-items-center text-center">
            <div>
              <Building2 className="mx-auto size-10 text-muted-foreground" />
              <h1 className="mt-4 text-xl font-semibold">Kiosk tidak valid</h1>
              <Button
                className="mt-5"
                variant="outline"
                render={<Link to={KIOSK_LIST_PATH} />}
              >
                <ArrowLeft aria-hidden="true" />
                Kembali ke Kiosk
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  function refresh() {
    setRetryKey((value) => value + 1)
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      {loadState === "loading" && <DetailLoadingState />}

      {loadState === "not-found" && (
        <Card>
          <CardContent className="grid min-h-72 place-items-center text-center">
            <div>
              <Building2 className="mx-auto size-10 text-muted-foreground" />
              <h1 className="mt-4 text-xl font-semibold">
                Kiosk tidak ditemukan
              </h1>
              <Button
                className="mt-5"
                variant="outline"
                render={<Link to={KIOSK_LIST_PATH} />}
              >
                <ArrowLeft aria-hidden="true" />
                Kembali ke Kiosk
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loadState === "error" && (
        <Card>
          <CardContent className="grid min-h-72 place-items-center text-center">
            <div className="max-w-md">
              <CircleAlert className="mx-auto size-10 text-destructive" />
              <h1 className="mt-4 text-xl font-semibold">
                Detail kiosk gagal dimuat
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Button variant="outline" render={<Link to={KIOSK_LIST_PATH} />}>
                  <ArrowLeft aria-hidden="true" />
                  Kembali
                </Button>
                <Button onClick={refresh}>
                  <RefreshCw aria-hidden="true" />
                  Coba lagi
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loadState === "success" && partner && (
        <>
          <Button
            variant="ghost"
            className="-ml-2"
            render={<Link to={KIOSK_LIST_PATH} />}
          >
            <ArrowLeft aria-hidden="true" />
            Kembali ke Kiosk
          </Button>

          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">
                    {getPartnerDisplayName(partner)}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {partner.company_name} · {getPartnerPlanName(partner)}
                  </CardDescription>
                </div>
                <PartnerStatusBadge status={partner.status} />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="mt-1 break-all font-medium">{partner.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telepon</p>
                <p className="mt-1 font-medium">{partner.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alamat</p>
                <p className="mt-1 font-medium">{partner.address || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4" aria-labelledby="booth-list-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="booth-list-title" className="text-xl font-semibold">
                  Daftar booth
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {booths.length} booth terdaftar pada kiosk ini.
                </p>
              </div>
              <Button onClick={() => setFormDialog({ booth: null })}>
                <Plus aria-hidden="true" />
                Tambah booth
              </Button>
            </div>

            {booths.length === 0 ? (
              <Card>
                <CardContent className="grid min-h-56 place-items-center text-center">
                  <div>
                    <Monitor className="mx-auto size-9 text-muted-foreground" />
                    <h3 className="mt-3 text-lg font-semibold">
                      Belum ada booth
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tambahkan booth pertama untuk kiosk ini.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {booths.map((booth) => (
                  <BoothCard
                    key={booth.id}
                    booth={booth}
                    onEdit={() => setFormDialog({ booth })}
                    onDelete={() => setDeleteTarget(booth)}
                  />
                ))}
              </div>
            )}
          </section>

          {formDialog && (
            <BoothFormDialog
              key={formDialog.booth?.id ?? "new-booth"}
              partnerId={partner.id}
              partnerName={partner.company_name}
              booth={formDialog.booth}
              open
              onOpenChange={(open) => {
                if (!open) setFormDialog(null)
              }}
              onSaved={(savedBooth, isNew) => {
                toast.success(
                  isNew
                    ? `Booth ${savedBooth.name} berhasil ditambahkan.`
                    : `Booth ${savedBooth.name} berhasil diperbarui.`
                )
                refresh()
              }}
              onUnauthorized={() => void handleUnauthorized()}
            />
          )}

          {deleteTarget && (
            <BoothDeleteDialog
              key={deleteTarget.id}
              booth={deleteTarget}
              open
              onOpenChange={(open) => {
                if (!open) setDeleteTarget(null)
              }}
              onDeleted={(deletedBooth) => {
                setDeleteTarget(null)
                toast.success(`Booth ${deletedBooth.name} berhasil dihapus.`)
                refresh()
              }}
              onUnauthorized={() => void handleUnauthorized()}
            />
          )}
        </>
      )}

      <Toaster position="top-right" />
    </div>
  )
}
