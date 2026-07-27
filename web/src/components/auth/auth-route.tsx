import { LoaderCircle } from "lucide-react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { isSuperAdmin } from "@/features/auth/auth-access"
import { useAuth } from "@/features/auth/auth-context"

function AuthLoadingScreen() {
  return (
    <main className="grid min-h-svh place-items-center bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Memeriksa sesi...
      </div>
    </main>
  )
}

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === "checking") {
    return <AuthLoadingScreen />
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function RequireSuperAdmin() {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === "checking") {
    return <AuthLoadingScreen />
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isSuperAdmin(user)) {
    return (
      <Navigate
        to="/admin/forbidden"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}

export function AnonymousOnly() {
  const { status } = useAuth()

  if (status === "checking") {
    return <AuthLoadingScreen />
  }

  if (status === "authenticated") {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
