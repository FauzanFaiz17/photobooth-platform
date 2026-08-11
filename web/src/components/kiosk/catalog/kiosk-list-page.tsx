import {
  Building2,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
} from "lucide-react"
import { useCallback, useEffect, useState, type ReactElement } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { PartnerStatusBadge } from "@/components/partner-management/partner-status-badge"
import {
  createPartnerInitials,
  formatPartnerDate,
  formatPartnerDateTime,
  getPartnerDisplayName,
  getPartnerPlanName,
} from "@/components/partner-management/partner-formatters"
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"
import {
  getPartners,
  resolvePartnerLogoUrl,
} from "@/features/partners/partner-service"
import type { PartnerRecord } from "@/features/partners/partner.types"
import { ApiError } from "@/lib/api-client"

const KIOSK_PATH = "/admin/kiosk"
type LoadState = "loading" | "success" | "error"

function KioskCard({ kiosk }: { readonly kiosk: PartnerRecord }) {
  const displayName = getPartnerDisplayName(kiosk)
  const logoUrl = resolvePartnerLogoUrl(kiosk.logo)

  return (
    <Link
      to={`/admin/kiosk/${kiosk.id}`}
      state={{ from: KIOSK_PATH }}
      className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Lihat booth ${displayName}`}
    >
      <Card className="h-full min-w-0 transition-colors hover:bg-muted/30">
        <CardHeader className="border-b">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar className="size-12">
              {logoUrl && <AvatarImage src={logoUrl} alt={displayName} />}
              <AvatarFallback className="font-semibold">
                {createPartnerInitials(kiosk.company_name) || "KS"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate">
                <h2>{displayName}</h2>
              </CardTitle>
              <CardDescription className="mt-1 truncate">
                {kiosk.brand_name
                  ? kiosk.company_name
                  : `Kiosk #${kiosk.id}`}
              </CardDescription>
            </div>
            <PartnerStatusBadge status={kiosk.status} />
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          <div className="grid gap-3 text-sm">
            <div className="flex min-w-0 items-start gap-3">
              <Mail
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 break-all">{kiosk.email}</span>
            </div>
            <div className="flex min-w-0 items-start gap-3">
              <Phone
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span>{kiosk.phone || "Nomor telepon belum diisi"}</span>
            </div>
            <div className="flex min-w-0 items-start gap-3">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 wrap-break-word">
                {kiosk.address || "Alamat belum diisi"}
              </span>
            </div>
          </div>

          <dl className="grid gap-3 border-t pt-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Paket</dt>
              <dd className="mt-1 font-medium">
                {getPartnerPlanName(kiosk)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Masa aktif</dt>
              <dd className="mt-1 font-medium">
                {kiosk.subscription
                  ? formatPartnerDate(kiosk.subscription.ends_at)
                  : "Tidak tersedia"}
              </dd>
            </div>
          </dl>
        </CardContent>

        <CardFooter className="justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4" aria-hidden="true" />
            Terdaftar {formatPartnerDateTime(kiosk.created_at)}
          </span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </CardFooter>
      </Card>
    </Link>
  )
}

function KioskLoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Memuat kiosk" aria-busy="true">
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function KioskListPage(): ReactElement {
  const location = useLocation()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const [kiosks, setKiosks] = useState<ReadonlyArray<PartnerRecord>>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)

  const handleUnauthorized = useCallback(async () => {
    await logout()
    navigate("/login", { replace: true, state: { from: location } })
  }, [location, logout, navigate])

  useEffect(() => {
    if (!token) return

    const accessToken = token
    const controller = new AbortController()

    async function loadKiosks() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        // ponytail: one request covers the current kiosk count; paginate beyond 100.
        const response = await getPartners(
          accessToken,
          {
            sort: "company_name",
            direction: "asc",
            per_page: 100,
          },
          controller.signal
        )

        if (controller.signal.aborted) return

        setKiosks(response.data)
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
            state: { from: KIOSK_PATH },
          })
          return
        }

        setKiosks([])
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
        )
        setLoadState("error")
      }
    }

    void loadKiosks()
    return () => controller.abort()
  }, [handleUnauthorized, navigate, retryKey, token])

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kiosk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loadState === "success" ? `${kiosks.length} kiosk terdaftar` : "Memuat data kiosk"}
          </p>
        </div>
      </header>

      {loadState === "loading" && <KioskLoadingState />}

      {loadState === "error" && (
        <div className="grid min-h-72 place-items-center border-y px-6 py-12 text-center">
          <div className="max-w-md">
            <CircleAlert className="mx-auto size-9 text-destructive" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Data kiosk gagal dimuat</h2>
            <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => setRetryKey((value) => value + 1)}
            >
              <RefreshCw aria-hidden="true" />
              Coba lagi
            </Button>
          </div>
        </div>
      )}

      {loadState === "success" && kiosks.length === 0 && (
        <div className="grid min-h-72 place-items-center border-y px-6 py-12 text-center">
          <div className="max-w-md">
            <Building2 className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Belum ada kiosk</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Data kiosk akan muncul setelah partner tersedia di backend.
            </p>
          </div>
        </div>
      )}

      {loadState === "success" && kiosks.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Daftar kiosk">
          {kiosks.map((kiosk) => (
            <KioskCard key={kiosk.id} kiosk={kiosk} />
          ))}
        </section>
      )}
    </div>
  )
}
