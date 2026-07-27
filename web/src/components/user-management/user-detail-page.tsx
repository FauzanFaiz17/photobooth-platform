import { useEffect, useState } from "react"
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom"

import { useAuth } from "@/features/auth/auth-context"
import { getUser } from "@/features/users/user-service"
import type { UserRecord } from "@/features/users/user.types"
import { ApiError } from "@/lib/api-client"

import { UserDetailHeader } from "./user-detail-header"
import { UserDetailInformation } from "./user-detail-information"
import {
  UserDetailErrorState,
  UserDetailLoadingState,
  UserDetailNotFoundState,
} from "./user-detail-states"

const USER_LIST_PATH = "/admin/settings/users"

type LoadState = "loading" | "success" | "not-found" | "error"

function parseUserId(value: string | undefined): number | null {
  if (!value) return null

  const userId = Number(value)
  return Number.isInteger(userId) && userId > 0 ? userId : null
}

function getUserListReturnPath(locationState: unknown): string {
  if (typeof locationState !== "object" || locationState === null) {
    return USER_LIST_PATH
  }

  const from = Reflect.get(locationState, "from")
  if (
    typeof from === "string" &&
    (from === USER_LIST_PATH || from.startsWith(`${USER_LIST_PATH}?`))
  ) {
    return from
  }

  return USER_LIST_PATH
}

export function UserDetailPage() {
  const { userId: userIdParam } = useParams<{ userId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const userId = parseUserId(userIdParam)
  const returnTo = getUserListReturnPath(location.state)
  const [user, setUser] = useState<UserRecord | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!token || userId === null) return

    const accessToken = token
    const requestedUserId = userId
    const controller = new AbortController()

    async function loadUser() {
      setLoadState("loading")
      setErrorMessage("")

      try {
        const result = await getUser(
          accessToken,
          requestedUserId,
          controller.signal
        )

        if (controller.signal.aborted) return

        setUser(result)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return

        if (error instanceof ApiError && error.status === 401) {
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
          setUser(null)
          setLoadState("not-found")
          return
        }

        setUser(null)
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
        )
        setLoadState("error")
      }
    }

    void loadUser()
    return () => controller.abort()
  }, [
    location.pathname,
    location.search,
    logout,
    navigate,
    retryKey,
    token,
    userId,
  ])

  if (userId === null) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <UserDetailNotFoundState returnTo={returnTo} invalidId />
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      {loadState === "loading" && <UserDetailLoadingState />}

      {loadState === "not-found" && (
        <UserDetailNotFoundState returnTo={returnTo} />
      )}

      {loadState === "error" && (
        <UserDetailErrorState
          message={errorMessage}
          returnTo={returnTo}
          onRetry={() => setRetryKey((value) => value + 1)}
        />
      )}

      {loadState === "success" && user && (
        <>
          <UserDetailHeader user={user} returnTo={returnTo} />
          <UserDetailInformation user={user} />
        </>
      )}
    </div>
  )
}
