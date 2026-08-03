import { useCallback, useEffect, useState } from "react"
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom"
import { toast } from "sonner"

import { Toaster } from "@/components/ui/sonner"
import { useAuth } from "@/features/auth/auth-context"
import { getPartner } from "@/features/partners/partner-service"
import type { PartnerRecord } from "@/features/partners/partner.types"
import { ApiError } from "@/lib/api-client"

import { PartnerDeleteDialog } from "./partner-delete-dialog"
import { PartnerDetailHeader } from "./partner-detail-header"
import { PartnerDetailInformation } from "./partner-detail-information"
import {
  PartnerDetailErrorState,
  PartnerDetailLoadingState,
  PartnerDetailNotFoundState,
} from "./partner-detail-states"
import { PartnerFormDialog } from "./partner-form-dialog"
import { PartnerUserList } from "./partner-user-list"

const PARTNER_LIST_PATH = "/admin/settings/users?tab=partners"
const SETTINGS_PATH = "/admin/settings/users"

type LoadState = "loading" | "success" | "not-found" | "error"

function parsePartnerId(value: string | undefined): number | null {
  if (!value) return null

  const partnerId = Number(value)
  return Number.isInteger(partnerId) && partnerId > 0 ? partnerId : null
}

function getPartnerListReturnPath(locationState: unknown): string {
  if (typeof locationState !== "object" || locationState === null) {
    return PARTNER_LIST_PATH
  }

  const from = Reflect.get(locationState, "from")
  if (typeof from === "string" && from.startsWith(`${SETTINGS_PATH}?`)) {
    return from
  }

  return PARTNER_LIST_PATH
}

export function PartnerDetailPage() {
  const { partnerId: partnerIdParam } = useParams<{ partnerId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const partnerId = parsePartnerId(partnerIdParam)
  const returnTo = getPartnerListReturnPath(location.state)
  const [partner, setPartner] = useState<PartnerRecord | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleUnauthorized = useCallback(async () => {
    await logout()
    navigate("/login", {
      replace: true,
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
        },
      },
    })
  }, [location.pathname, location.search, logout, navigate])

  useEffect(() => {
    if (!token || partnerId === null) return

    const accessToken = token
    const requestedPartnerId = partnerId
    const controller = new AbortController()

    async function loadPartner() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const result = await getPartner(
          accessToken,
          requestedPartnerId,
          controller.signal
        )

        if (controller.signal.aborted) return

        setPartner(result)
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
          setPartner(null)
          setLoadState("not-found")
          return
        }

        setPartner(null)
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
        )
        setLoadState("error")
      }
    }

    void loadPartner()
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
        <PartnerDetailNotFoundState returnTo={returnTo} invalidId />
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      {loadState === "loading" && <PartnerDetailLoadingState />}

      {loadState === "not-found" && (
        <PartnerDetailNotFoundState returnTo={returnTo} />
      )}

      {loadState === "error" && (
        <PartnerDetailErrorState
          message={errorMessage}
          returnTo={returnTo}
          onRetry={() => setRetryKey((value) => value + 1)}
        />
      )}

      {loadState === "success" && partner && (
        <>
          <PartnerDetailHeader
            partner={partner}
            returnTo={returnTo}
            onEdit={() => setEditOpen(true)}
            onDelete={() => setDeleteOpen(true)}
          />
          <PartnerDetailInformation partner={partner} />
          <PartnerUserList
            partnerId={partner.id}
            partnerName={partner.company_name}
            onUnauthorized={() => void handleUnauthorized()}
          />

          {editOpen && (
            <PartnerFormDialog
              key={`edit-${partner.id}`}
              partner={partner}
              open
              onOpenChange={setEditOpen}
              onSaved={(savedPartner) => {
                setPartner(savedPartner)
                toast.success("Partner berhasil diperbarui.")
              }}
              onUnauthorized={() => void handleUnauthorized()}
            />
          )}

          {deleteOpen && (
            <PartnerDeleteDialog
              key={`delete-${partner.id}`}
              partner={partner}
              open
              onOpenChange={setDeleteOpen}
              onDeleted={(deletedPartner) => {
                navigate(returnTo, {
                  replace: true,
                  state: {
                    deletedPartner: deletedPartner.company_name,
                  },
                })
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
