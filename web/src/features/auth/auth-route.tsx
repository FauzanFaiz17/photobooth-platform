import { LoaderCircle } from "lucide-react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "./auth-context"

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
